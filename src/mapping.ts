import {
  dataSource,
  Address,
  BigInt,
  DataSourceContext,
} from "@graphprotocol/graph-ts";
import {
  CvxLockerOld,
  RewardPaid as CvxLockerOldRewardPaid,
} from "../generated/CvxLockerOld/CvxLockerOld";
import {
  CvxLocker,
  RewardPaid as CvxLockerRewardPaid,
} from "../generated/CvxLocker/CvxLocker";
import {
  CvxLockerV2,
  RewardPaid as CvxLockerV2RewardPaid,
} from "../generated/CvxLockerV2/CvxLockerV2";
import {
  CvxRewardPool,
  RewardPaid as CvxRewardPoolRewardPaid,
} from "../generated/CvxRewardPool/CvxRewardPool";
import {
  RewardPaid as vlCvxExtraRewardDistributionOldRewardPaid,
  vlCvxExtraRewardDistributionOld,
} from "../generated/vlCvxExtraRewardDistributionOld/vlCvxExtraRewardDistributionOld";
import {
  RewardPaid as vlCvxExtraRewardDistributionRewardPaid,
  vlCvxExtraRewardDistribution,
} from "../generated/vlCvxExtraRewardDistribution/vlCvxExtraRewardDistribution";
import {
  RewardPaid as vlCvxExtraRewardDistributionV2RewardPaid,
  vlCvxExtraRewardDistributionV2,
} from "../generated/vlCvxExtraRewardDistributionV2/vlCvxExtraRewardDistributionV2";
import {
  ConvexMasterChef,
  RewardPaid as ConvexMasterChefRewardPaid,
} from "../generated/ConvexMasterChef/ConvexMasterChef";
import {
  BaseRewardPool,
  RewardPaid as PoolCrvRewardsRewardPaid,
} from "../generated/templates/PoolCrvRewards/BaseRewardPool";
import { AddPoolCall, Booster } from "../generated/Booster/Booster";
import { Platform, Reward, User, PlatformReward } from "../generated/schema";
import { CrvRewardsPool } from "../generated/templates";

const Booster_address = "0xf403c135812408bfbe8713b5a23a04b3d48aae31";
const vlCvxExtraRewardDistributionOld_address =
  "0x8ed4bbf39e3080b35da84a13a0d1a2fdce1e0602";
const vlCvxExtraRewardDistribution_address =
  "0xdecc7d761496d30f30b92bdf764fb8803c79360d";
const vlCvxExtraRewardDistributionV2_address =
  "0x9b622f2c40b80ef5efb14c2b2239511ffbfab702";
const CvxLockerOld_address = "0x5ae0fca14ed08a3122ffb8d624e063e07bce56a1";
const CvxLocker_address = "0xd18140b4b819b895a3dba5442f959fa44994af50";
const CvxLockerV2_address = "0x72a19342e8f1838460ebfccef09f6585e32db86e";
const CvxRewardPool_address = "0xcf50b810e57ac33b91dcf525c6ddd9881b139332";
const ConvexMasterChef_address = "0x5f465e9fcffc217c5849906216581a657cd60605";
const platform_curve = "curve";
const platform_frax = "frax";

function getPlatform(platformId: string): Platform {
  let platform = Platform.load(platformId);

  if (!platform) {
    platform = new Platform(platformId);
  }

  return platform;
}

function getUser(address: Address): User {
  let user = User.load(address.toHexString());

  if (!user) {
    user = new User(address.toHexString());
    user.address = address;
    user.save();
  }

  return user;
}

/**
 * Total rewards accumulated by given user
 * @param platform
 * @param user
 * @param poolAddress
 * @param stakingTokenAddress
 * @param rewardTokenAddress
 * @returns
 */
function getReward(
  platform: Platform,
  user: User,
  poolAddress: Address,
  stakingTokenAddress: Address,
  rewardTokenAddress: Address
): Reward {
  const id =
    platform.id +
    "-" +
    user.id +
    "-" +
    poolAddress.toHexString() +
    "-" +
    stakingTokenAddress.toHexString() +
    "-" +
    rewardTokenAddress.toHexString();
  let reward = Reward.load(id);

  if (!reward) {
    reward = new Reward(id);
    reward.platform = platform.id;
    reward.pool = poolAddress;
    reward.rewardToken = rewardTokenAddress;
    reward.stakingToken = stakingTokenAddress;
    reward.user = user.id;
    reward.save();
  }

  return reward;
}

/**
 * Total rewards accumulated by given platform
 * @param platform
 * @param poolAddress
 * @param stakingTokenAddress
 * @param rewardTokenAddress
 * @returns
 */
function getPlatformReward(
  platform: Platform,
  poolAddress: Address,
  stakingTokenAddress: Address,
  rewardTokenAddress: Address
): PlatformReward {
  const id =
    platform.id +
    "-" +
    poolAddress.toHexString() +
    "-" +
    stakingTokenAddress.toHexString() +
    "-" +
    rewardTokenAddress.toHexString();
  let platformReward = PlatformReward.load(id);

  if (!platformReward) {
    platformReward = new PlatformReward(id);
    platformReward.platform = platform.id;
    platformReward.pool = poolAddress;
    platformReward.rewardToken = rewardTokenAddress;
    platformReward.stakingToken = stakingTokenAddress;
    platformReward.save();
  }

  return platformReward;
}

// Booster
export function handleAddPool(call: AddPoolCall): void {
  const platform = getPlatform(platform_curve);
  const booster = Booster.bind(Address.fromString(Booster_address));
  const pid = platform.poolCount;
  const poolInfo = booster.try_poolInfo(pid);

  platform.poolCount = platform.poolCount.plus(BigInt.fromString("1"));

  if (!poolInfo.reverted) {
    const context = new DataSourceContext();
    context.setString("pid", call.to.toString());
    context.setString("crvRewardsPool", poolInfo.value.value3.toHexString());
    CrvRewardsPool.createWithContext(poolInfo.value.value3, context);
  }

  platform.save();
}

// CvxLockerOld
export function handleCvxLockerOldRewardPaid(
  event: CvxLockerOldRewardPaid
): void {
  const cvxLockerOld = CvxLockerOld.bind(
    Address.fromString(CvxLockerOld_address)
  );
  const user = getUser(event.params._user);
  const platform = getPlatform(platform_curve);
  const stakingToken = cvxLockerOld.stakingToken();
  const reward = getReward(
    platform,
    user,
    cvxLockerOld._address,
    stakingToken,
    event.params._rewardsToken
  );
  const totalReward = getPlatformReward(
    platform,
    cvxLockerOld._address,
    stakingToken,
    event.params._rewardsToken
  );

  reward.paidAmountCumulative = reward.paidAmountCumulative.plus(
    event.params._reward
  );
  reward.timestamp = event.block.timestamp;

  totalReward.paidAmountCumulative = totalReward.paidAmountCumulative.plus(
    event.params._reward
  );
  totalReward.timestamp = event.block.timestamp;

  reward.save();
  totalReward.save();
}

// CvxLocker
export function handleCvxLockerRewardPaid(event: CvxLockerRewardPaid): void {
  const cvxLocker = CvxLocker.bind(Address.fromString(CvxLocker_address));
  const user = getUser(event.params._user);
  const platform = getPlatform(platform_curve);
  const stakingToken = cvxLocker.stakingToken();
  const reward = getReward(
    platform,
    user,
    cvxLocker._address,
    stakingToken,
    event.params._rewardsToken
  );
  const totalReward = getPlatformReward(
    platform,
    cvxLocker._address,
    stakingToken,
    event.params._rewardsToken
  );

  reward.paidAmountCumulative = reward.paidAmountCumulative.plus(
    event.params._reward
  );
  reward.timestamp = event.block.timestamp;

  totalReward.paidAmountCumulative = totalReward.paidAmountCumulative.plus(
    event.params._reward
  );
  totalReward.timestamp = event.block.timestamp;

  reward.save();
  totalReward.save();
}

// CvxLockerV2
export function handleCvxLockerV2RewardPaid(
  event: CvxLockerV2RewardPaid
): void {
  const cvxLockerV2 = CvxLockerV2.bind(Address.fromString(CvxLockerV2_address));
  const user = getUser(event.params._user);
  const platform = getPlatform(platform_curve);
  const stakingToken = cvxLockerV2.stakingToken();
  const reward = getReward(
    platform,
    user,
    cvxLockerV2._address,
    stakingToken,
    event.params._rewardsToken
  );
  const totalReward = getPlatformReward(
    platform,
    cvxLockerV2._address,
    stakingToken,
    event.params._rewardsToken
  );

  reward.paidAmountCumulative = reward.paidAmountCumulative.plus(
    event.params._reward
  );
  reward.timestamp = event.block.timestamp;

  totalReward.paidAmountCumulative = totalReward.paidAmountCumulative.plus(
    event.params._reward
  );
  totalReward.timestamp = event.block.timestamp;

  reward.save();
  totalReward.save();
}

// vlCvxExtraRewardDistribution
export function handleVlCvxExtraRewardDistributionOldRewardPaid(
  event: vlCvxExtraRewardDistributionOldRewardPaid
): void {
  const _vlCvxExtraRewardDistributionOld = vlCvxExtraRewardDistributionOld.bind(
    Address.fromString(vlCvxExtraRewardDistributionOld_address)
  );
  const user = getUser(event.params._user);
  const platform = getPlatform(platform_curve);
  const stakingToken = _vlCvxExtraRewardDistributionOld.cvxlocker();
  const reward = getReward(
    platform,
    user,
    _vlCvxExtraRewardDistributionOld._address,
    stakingToken,
    event.params._rewardsToken
  );
  const totalReward = getPlatformReward(
    platform,
    _vlCvxExtraRewardDistributionOld._address,
    stakingToken,
    event.params._rewardsToken
  );

  reward.paidAmountCumulative = reward.paidAmountCumulative.plus(
    event.params._reward
  );
  reward.timestamp = event.block.timestamp;

  totalReward.paidAmountCumulative = totalReward.paidAmountCumulative.plus(
    event.params._reward
  );
  totalReward.timestamp = event.block.timestamp;

  reward.save();
  totalReward.save();
}

// vlCvxExtraRewardDistribution
export function handleVlCvxExtraRewardDistributionRewardPaid(
  event: vlCvxExtraRewardDistributionRewardPaid
): void {
  const _vlCvxExtraRewardDistribution = vlCvxExtraRewardDistribution.bind(
    Address.fromString(vlCvxExtraRewardDistribution_address)
  );
  const user = getUser(event.params._user);
  const platform = getPlatform(platform_curve);
  const stakingToken = _vlCvxExtraRewardDistribution.cvxlocker();
  const reward = getReward(
    platform,
    user,
    _vlCvxExtraRewardDistribution._address,
    stakingToken,
    event.params._rewardsToken
  );
  const totalReward = getPlatformReward(
    platform,
    _vlCvxExtraRewardDistribution._address,
    stakingToken,
    event.params._rewardsToken
  );

  reward.paidAmountCumulative = reward.paidAmountCumulative.plus(
    event.params._reward
  );
  reward.timestamp = event.block.timestamp;

  totalReward.paidAmountCumulative = totalReward.paidAmountCumulative.plus(
    event.params._reward
  );
  totalReward.timestamp = event.block.timestamp;

  reward.save();
  totalReward.save();
}

// vlCvxExtraRewardDistributionV2
export function handleVlCvxExtraRewardDistributionV2RewardPaid(
  event: vlCvxExtraRewardDistributionV2RewardPaid
): void {
  const _vlCvxExtraRewardDistributionV2 = vlCvxExtraRewardDistributionV2.bind(
    Address.fromString(vlCvxExtraRewardDistributionV2_address)
  );
  const user = getUser(event.params._user);
  const platform = getPlatform(platform_curve);
  const stakingToken = _vlCvxExtraRewardDistributionV2.cvxlocker();
  const reward = getReward(
    platform,
    user,
    _vlCvxExtraRewardDistributionV2._address,
    stakingToken,
    event.params._rewardsToken
  );
  const totalReward = getPlatformReward(
    platform,
    _vlCvxExtraRewardDistributionV2._address,
    stakingToken,
    event.params._rewardsToken
  );

  reward.paidAmountCumulative = reward.paidAmountCumulative.plus(
    event.params._reward
  );
  reward.timestamp = event.block.timestamp;

  totalReward.paidAmountCumulative = totalReward.paidAmountCumulative.plus(
    event.params._reward
  );
  totalReward.timestamp = event.block.timestamp;

  reward.save();
  totalReward.save();
}

// CvxRewardPool
export function handleCvxRewardPoolRewardPaid(
  event: CvxRewardPoolRewardPaid
): void {
  const user = getUser(event.params.user);
  const platform = getPlatform(platform_curve);
  const cvxRewardPool = CvxRewardPool.bind(
    Address.fromString(CvxRewardPool_address)
  );
  const stakingToken = cvxRewardPool.stakingToken();
  const rewardToken = cvxRewardPool.rewardToken();
  const reward = getReward(
    platform,
    user,
    cvxRewardPool._address,
    stakingToken,
    rewardToken
  );
  const totalReward = getPlatformReward(
    platform,
    cvxRewardPool._address,
    stakingToken,
    rewardToken
  );

  reward.paidAmountCumulative = reward.paidAmountCumulative.plus(
    event.params.reward
  );
  reward.timestamp = event.block.timestamp;

  totalReward.paidAmountCumulative = totalReward.paidAmountCumulative.plus(
    event.params.reward
  );
  totalReward.timestamp = event.block.timestamp;

  reward.save();
  totalReward.save();
}

// ConvexMasterChef
export function handleConvexMasterChefRewardPaid(
  event: ConvexMasterChefRewardPaid
): void {
  const user = getUser(event.params.user);
  const platform = getPlatform(platform_curve);
  const convexMasterChef = ConvexMasterChef.bind(
    Address.fromString(ConvexMasterChef_address)
  );
  const pool = convexMasterChef.poolInfo(event.params.pid);
  const stakingToken = pool.value0; // lpToken
  const rewardToken = convexMasterChef.cvx();
  const reward = getReward(
    platform,
    user,
    convexMasterChef._address,
    stakingToken,
    rewardToken
  );
  const totalReward = getPlatformReward(
    platform,
    convexMasterChef._address,
    stakingToken,
    rewardToken
  );

  reward.paidAmountCumulative = reward.paidAmountCumulative.plus(
    event.params.amount
  );
  reward.timestamp = event.block.timestamp;

  totalReward.paidAmountCumulative = totalReward.paidAmountCumulative.plus(
    event.params.amount
  );
  totalReward.timestamp = event.block.timestamp;

  reward.save();
  totalReward.save();
}

// BaseRewardPool
export function handleCrvRewardsPoolRewardPaid(
  event: PoolCrvRewardsRewardPaid
): void {
  const context = dataSource.context();
  const user = getUser(event.params.user);
  const platform = getPlatform(platform_curve);
  const baseRewardPool = BaseRewardPool.bind(
    Address.fromString(context.getString("crvRewardsPool"))
  );
  const stakingToken = baseRewardPool.stakingToken();
  const rewardToken = baseRewardPool.rewardToken();
  const reward = getReward(
    platform,
    user,
    baseRewardPool._address,
    stakingToken,
    rewardToken
  );
  const totalReward = getPlatformReward(
    platform,
    baseRewardPool._address,
    stakingToken,
    rewardToken
  );

  reward.paidAmountCumulative = reward.paidAmountCumulative.plus(
    event.params.reward
  );
  reward.timestamp = event.block.timestamp;

  totalReward.paidAmountCumulative = totalReward.paidAmountCumulative.plus(
    event.params.reward
  );
  totalReward.timestamp = event.block.timestamp;

  reward.save();
  totalReward.save();
}
