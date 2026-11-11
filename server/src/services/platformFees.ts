import PlatformFeePolicy from '../models/PlatformFeePolicy';

const calculatePlatformFee = async (transactionType: 'consultation' | 'lead' | 'service', amount = 0) => {
  const policy = await PlatformFeePolicy.findOne({ key: 'default', isActive: true });
  if (policy) {
    if (!policy.appliesTo.includes(transactionType)) return 0;
    return policy.type === 'percentage'
      ? Math.round((amount * policy.amount) / 100)
      : Math.round(policy.amount);
  }
  return Number(process.env.PLATFORM_FEE_AMOUNT) || 10000;
};

export default calculatePlatformFee;
