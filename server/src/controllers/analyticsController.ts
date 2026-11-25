import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Engagement from '../models/Engagement';
import FractionalProposal from '../models/FractionalProposal';
import Lead from '../models/Lead';
import User from '../models/User';
import ProfessionalProfile from '../models/ProfessionalProfile';
import Subscription from '../models/Subscription';
import Payment from '../models/Payment';

// ============================================
// Lawyer Analytics
// ============================================

// @desc    Get lawyer analytics dashboard
// @route   GET /api/analytics/lawyer
export const getLawyerAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const profile = await ProfessionalProfile.findOne({ userId: req.user?._id });
    if (!profile) {
      return res.status(404).json({ message: 'Professional profile not found' });
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Get all engagements for this lawyer
    const engagements = await Engagement.find({ lawyerId: profile._id })
      .populate('clientId', 'firstName lastName email')
      .populate('subscriptionId');

    const activeEngagements = engagements.filter(e => e.status === 'active');
    const completedEngagements = engagements.filter(e => e.status === 'completed');
    const terminatedEngagements = engagements.filter(e => e.status === 'terminated');

    // Revenue calculations
    const totalRevenue = engagements.reduce((sum, e) => sum + (e.totalBilled || 0), 0);
    const monthlyRecurringRevenue = activeEngagements.reduce((sum, e) => sum + (e.monthlyRetainer || 0), 0);

    // This month's revenue
    const thisMonthRevenue = engagements
      .filter(e => e.lastBillingDate && new Date(e.lastBillingDate) >= startOfMonth)
      .reduce((sum, e) => sum + (e.totalBilled || 0), 0);

    // Last month's revenue
    const lastMonthRevenue = engagements
      .filter(e => e.lastBillingDate &&
        new Date(e.lastBillingDate) >= startOfLastMonth &&
        new Date(e.lastBillingDate) <= endOfLastMonth)
      .reduce((sum, e) => sum + (e.totalBilled || 0), 0);

    // Hours analytics
    const totalHoursLogged = engagements.reduce((sum, e) => sum + (e.hoursUsedTotal || 0), 0);
    const thisMonthHours = activeEngagements.reduce((sum, e) => sum + (e.hoursUsedThisMonth || 0), 0);
    const totalCapacityHours = activeEngagements.reduce((sum, e) => sum + (e.hoursPerMonth || 0), 0);
    const utilizationRate = totalCapacityHours > 0 ? (thisMonthHours / totalCapacityHours) * 100 : 0;

    // Proposals funnel
    const proposals = await FractionalProposal.find({ lawyerId: profile._id });
    const proposalsSent = proposals.filter(p => ['sent', 'viewed'].includes(p.status)).length;
    const proposalsAccepted = proposals.filter(p => ['accepted', 'active'].includes(p.status)).length;
    const proposalsRejected = proposals.filter(p => ['rejected', 'expired', 'withdrawn'].includes(p.status)).length;
    const proposalsPending = proposals.filter(p => p.status === 'draft').length;
    const conversionRate = proposalsSent > 0 ? (proposalsAccepted / proposalsSent) * 100 : 0;

    // Client acquisition
    const newClientsThisMonth = new Set(
      engagements
        .filter(e => e.createdAt >= startOfMonth)
        .map(e => e.clientId.toString())
    ).size;

    const totalClients = new Set(engagements.map(e => e.clientId.toString())).size;

    // Hours by category (last 30 days)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const hoursByCategory: Record<string, number> = {};
    engagements.forEach(e => {
      e.hourEntries
        .filter(h => h.date >= thirtyDaysAgo)
        .forEach(h => {
          hoursByCategory[h.category] = (hoursByCategory[h.category] || 0) + h.hours;
        });
    });

    // Revenue by month (last 6 months)
    const revenueByMonth: Array<{ month: string; revenue: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const monthRevenue = engagements
        .filter(e => e.lastBillingDate &&
          new Date(e.lastBillingDate) >= monthStart &&
          new Date(e.lastBillingDate) <= monthEnd)
        .reduce((sum, e) => sum + (e.totalBilled || 0), 0);
      revenueByMonth.push({
        month: monthStart.toLocaleString('default', { month: 'short', year: 'numeric' }),
        revenue: monthRevenue
      });
    }

    // Client retention
    const activeClientCount = activeEngagements.length;
    const churnedClients = terminatedEngagements.length;
    const retentionRate = totalClients > 0 ? ((totalClients - churnedClients) / totalClients) * 100 : 100;

    // Top clients by revenue
    const clientRevenueMap: Record<string, { name: string; revenue: number; hours: number }> = {};
    engagements.forEach(e => {
      const client = e.clientId as any;
      if (client) {
        const key = client._id.toString();
        if (!clientRevenueMap[key]) {
          clientRevenueMap[key] = {
            name: `${client.firstName} ${client.lastName}`,
            revenue: 0,
            hours: 0
          };
        }
        clientRevenueMap[key].revenue += e.totalBilled || 0;
        clientRevenueMap[key].hours += e.hoursUsedTotal || 0;
      });

    const topClients = Object.entries(clientRevenueMap)
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 5)
      .map(([id, data]) => ({ id, ...data }));

    res.json({
      revenue: {
        total: totalRevenue,
        monthlyRecurring: monthlyRecurringRevenue,
        thisMonth: thisMonthRevenue,
        lastMonth: lastMonthRevenue,
        growth: lastMonthRevenue > 0 ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0,
        byMonth: revenueByMonth,
      },
      engagements: {
        total: engagements.length,
        active: activeEngagements.length,
        completed: completedEngagements.length,
        terminated: terminatedEngagements.length,
        newThisMonth: newClientsThisMonth,
        totalClients,
        activeClients: activeClientCount,
        retentionRate: Math.round(retentionRate * 100) / 100,
      },
      hours: {
        totalLogged: totalHoursLogged,
        thisMonth: thisMonthHours,
        capacity: totalCapacityHours,
        utilization: Math.round(utilizationRate * 100) / 100,
        byCategory: hoursByCategory,
      },
      proposals: {
        sent: proposalsSent,
        accepted: proposalsAccepted,
        rejected: proposalsRejected,
        pending: proposalsPending,
        conversionRate: Math.round(conversionRate * 100) / 100,
      },
      topClients,
      recentActivity: engagements
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 10)
        .map(e => ({
          id: e._id,
          client: (e.clientId as any)?.firstName + ' ' + (e.clientId as any)?.lastName,
          status: e.status,
          monthlyRetainer: e.monthlyRetainer,
          lastActivity: e.updatedAt,
        })),
    });
  } catch (error: any) {
    console.error('Get lawyer analytics error:', error);
    res.status(500).json({ message: 'Failed to fetch analytics' });
  }
};

// ============================================
// Admin Analytics
// ============================================

// @desc    Get platform-wide analytics (admin)
// @route   GET /api/admin/analytics
export const getAdminAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Platform metrics
    const [
      totalLawyers,
      verifiedLawyers,
      totalClients,
      totalEngagements,
      activeEngagements,
      totalProposals,
      acceptedProposals,
      totalRevenue,
      thisMonthRevenue,
    ] = await Promise.all([
      ProfessionalProfile.countDocuments({}),
      ProfessionalProfile.countDocuments({ verificationStatus: 'verified' }),
      User.countDocuments({ role: 'client' }),
      Engagement.countDocuments({}),
      Engagement.countDocuments({ status: 'active' }),
      FractionalProposal.countDocuments({}),
      FractionalProposal.countDocuments({ status: { $in: ['accepted', 'active'] } }),
      Engagement.aggregate([
        { $group: { _id: null, total: { $sum: '$totalBilled' } } }
      ]).then(r => r[0]?.total || 0),
      Engagement.aggregate([
        {
          $match: {
            lastBillingDate: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
          }
        },
        { $group: { _id: null, total: { $sum: '$totalBilled' } } }
      ]).then(r => r[0]?.total || 0),
    ]);

    // Revenue by month (last 12 months)
    const now = new Date();
    const revenueByMonth = [];
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const revenue = await Engagement.aggregate([
        {
          $match: {
            lastBillingDate: { $gte: monthStart, $lte: monthEnd }
          }
        },
        { $group: { _id: null, total: { $sum: '$totalBilled' } } }
      ]).then(r => r[0]?.total || 0);

      revenueByMonth.push({
        month: monthStart.toLocaleString('default', { month: 'short', year: 'numeric' }),
        revenue,
      });
    }

    // Lawyers by status
    const lawyersByStatus = await ProfessionalProfile.aggregate([
      { $group: { _id: '$verificationStatus', count: { $sum: 1 } } }
    ]);

    // Proposals by status
    const proposalsByStatus = await FractionalProposal.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Engagements by status
    const engagementsByStatus = await Engagement.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Top lawyers by revenue
    const topLawyers = await Engagement.aggregate([
      { $group: { _id: '$lawyerId', totalRevenue: { $sum: '$totalBilled' }, engagementCount: { $sum: 1 } } },
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'professionalprofiles',
          localField: '_id',
          foreignField: '_id',
          as: 'profile'
        }
      },
      { $unwind: '$profile' },
      {
        $lookup: {
          from: 'users',
          localField: 'profile.userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          lawyerName: { $concat: ['$user.firstName', ' ', '$user.lastName'] },
          email: '$user.email',
          totalRevenue: 1,
          engagementCount: 1,
        }
      }
    ]);

    // Revenue by month (last 12 months)
    const monthlyRevenue = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const revenue = await Engagement.aggregate([
        { $match: { lastBillingDate: { $gte: monthStart, $lte: monthEnd } } },
        { $group: { _id: null, total: { $sum: '$totalBilled' } } }
      ]).then(r => r[0]?.total || 0);

      monthlyRevenue.push({
        month: new Date(now.getFullYear(), now.getMonth() - i).toLocaleString('default', { month: 'short', year: '2-digit' }),
        revenue,
      });
    }

    res.json({
      overview: {
        totalLawyers,
        verifiedLawyers,
        totalClients,
        totalEngagements,
        activeEngagements,
        totalProposals,
        acceptedProposals,
        totalRevenue,
        thisMonthRevenue,
      },
      charts: {
        revenueByMonth: monthlyRevenue,
        lawyersByStatus,
        proposalsByStatus,
        engagementsByStatus,
      },
      topLawyers,
      growth: {
        lawyersGrowth: 0, // Would need historical data
        clientsGrowth: 0,
        revenueGrowth: 0,
      },
    });
  } catch (error: any) {
    console.error('Get admin analytics error:', error);
    res.status(500).json({ message: 'Failed to fetch analytics' });
  }
};

// ============================================
// Client Analytics
// ============================================

// @desc    Get client analytics
// @route   GET /api/analytics/client
export const getClientAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const engagements = await Engagement.find({ clientId: req.user?._id })
      .populate('lawyerId', 'firstName lastName email photo city state fractionalGC')
      .populate('subscriptionId');

    const activeEngagements = engagements.filter(e => e.status === 'active');
    const completedEngagements = engagements.filter(e => e.status === 'completed');

    const totalSpent = engagements.reduce((sum, e) => sum + (e.totalBilled || 0), 0);
    const totalHours = engagements.reduce((sum, e) => sum + (e.hoursUsedTotal || 0), 0);

    res.json({
      engagements: {
        total: engagements.length,
        active: activeEngagements.length,
        completed: completedEngagements.length,
      },
      spending: {
        total: totalSpent,
        monthly: engagements
          .filter(e => e.status === 'active')
          .reduce((sum, e) => sum + (e.monthlyRetainer || 0), 0),
      },
      hours: {
        total: totalHours,
        byLawyer: engagements.map(e => ({
          lawyer: (e.lawyerId as any)?.userId?.firstName + ' ' + (e.lawyerId as any)?.userId?.lastName,
          hours: e.hoursUsedTotal,
          retainer: e.monthlyRetainer,
        }),
      },
      engagements: engagements.map(e => ({
        id: e._id,
        lawyer: (e.lawyerId as any)?.userId?.firstName + ' ' + (e.lawyerId as any)?.userId?.lastName,
        status: e.status,
        monthlyRetainer: e.monthlyRetainer,
        hoursUsed: e.hoursUsedTotal,
        startDate: e.startDate,
        endDate: e.endDate,
      }),
    });
  } catch (error: any) {
    console.error('Get client analytics error:', error);
    res.status(500).json({ message: 'Failed to fetch analytics' });
  }
};