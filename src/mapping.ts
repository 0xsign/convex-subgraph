import {
  dataSource,
  Address,
  BigInt,
  DataSourceContext,
} from "@graphprotocol/graph-ts";
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
  RewardPaid as vlCvxExtraRewardDistributionRewardPaid,
  vlCvxExtraRewardDistribution,
} from "../generated/vlCvxExtraRewardDistribution/vlCvxExtraRewardDistribution";
import {
  RewardPaid as vlCvxExtraRewardDistributionV2RewardPaid,
  vlCvxExtraRewardDistributionV2,
} from "../generated/vlCvxExtraRewardDistributionV2/vlCvxExtraRewardDistributionV2";
import {
  BaseRewardPool,
  RewardPaid as PoolCrvRewardsRewardPaid,
} from "../generated/templates/PoolCrvRewards/BaseRewardPool";
import { AddPoolCall, Booster } from "../generated/Booster/Booster";
import { Platform, Reward, User } from "../generated/schema";
import { CrvRewardsPool } from "../generated/templates";

const Booster_address = "0xf403c135812408bfbe8713b5a23a04b3d48aae31";
const vlCvxExtraRewardDistribution_address =
  "0xdecc7d761496d30f30b92bdf764fb8803c79360d";
const vlCvxExtraRewardDistributionV2_address =
  "0x9b622f2c40b80ef5efb14c2b2239511ffbfab702";
const CvxLocker_address = "0xd18140b4b819b895a3dba5442f959fa44994af50";
const CvxLockerV2_address = "0x72a19342e8f1838460ebfccef09f6585e32db86e";
const CvxRewardPool_address = "0xcf50b810e57ac33b91dcf525c6ddd9881b139332";
const platform_convex = "Convex";

function getPlatform(): Platform {
  let platform = Platform.load(platform_convex);

  if (!platform) {
    platform = new Platform(platform_convex);
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

function getReward(
  poolAddress: Address,
  stakingTokenAddress: Address,
  rewardTokenAddress: Address,
  user: User
): Reward {
  const id =
    stakingTokenAddress.toHexString() +
    "-" +
    rewardTokenAddress.toHexString() +
    "-" +
    user.id;
  let reward = Reward.load(id);

  if (!reward) {
    reward = new Reward(id);
    reward.pool = poolAddress;
    reward.rewardToken = rewardTokenAddress;
    reward.stakingToken = stakingTokenAddress;
    reward.user = user.id;
    reward.save();
  }

  return reward;
}

// Booster
export function handleAddPool(call: AddPoolCall): void {
  const platform = getPlatform();
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

// CvxLocker
export function handleCvxLockerRewardPaid(event: CvxLockerRewardPaid): void {
  const cvxLocker = CvxLocker.bind(Address.fromString(CvxLocker_address));
  const user = getUser(event.params._user);
  const stakingToken = cvxLocker.stakingToken();
  const paidReward = getReward(
    cvxLocker._address,
    stakingToken,
    event.params._rewardsToken,
    user
  );

  paidReward.paidAmountCumulative = paidReward.paidAmountCumulative.plus(
    event.params._reward
  );
  paidReward.timestamp = event.block.timestamp;

  paidReward.save();
}

// CvxLockerV2
export function handleCvxLockerV2RewardPaid(
  event: CvxLockerV2RewardPaid
): void {
  const cvxLockerV2 = CvxLockerV2.bind(Address.fromString(CvxLockerV2_address));
  const user = getUser(event.params._user);
  const stakingToken = cvxLockerV2.stakingToken();
  const paidReward = getReward(
    cvxLockerV2._address,
    stakingToken,
    event.params._rewardsToken,
    user
  );

  paidReward.paidAmountCumulative = paidReward.paidAmountCumulative.plus(
    event.params._reward
  );
  paidReward.timestamp = event.block.timestamp;

  paidReward.save();
}

// vlCvxExtraRewardDistribution
export function handleVlCvxExtraRewardDistributionRewardPaid(
  event: vlCvxExtraRewardDistributionRewardPaid
): void {
  const _vlCvxExtraRewardDistribution = vlCvxExtraRewardDistribution.bind(
    Address.fromString(vlCvxExtraRewardDistribution_address)
  );
  const user = getUser(event.params._user);
  const stakingToken = _vlCvxExtraRewardDistribution.cvxlocker();
  const paidReward = getReward(
    _vlCvxExtraRewardDistribution._address,
    stakingToken,
    event.params._rewardsToken,
    user
  );

  paidReward.paidAmountCumulative = paidReward.paidAmountCumulative.plus(
    event.params._reward
  );
  paidReward.timestamp = event.block.timestamp;

  paidReward.save();
}

// vlCvxExtraRewardDistributionV2
export function handleVlCvxExtraRewardDistributionV2RewardPaid(
  event: vlCvxExtraRewardDistributionV2RewardPaid
): void {
  const _vlCvxExtraRewardDistributionV2 = vlCvxExtraRewardDistributionV2.bind(
    Address.fromString(vlCvxExtraRewardDistributionV2_address)
  );
  const user = getUser(event.params._user);
  const stakingToken = _vlCvxExtraRewardDistributionV2.cvxlocker();
  const paidReward = getReward(
    _vlCvxExtraRewardDistributionV2._address,
    stakingToken,
    event.params._rewardsToken,
    user
  );

  paidReward.paidAmountCumulative = paidReward.paidAmountCumulative.plus(
    event.params._reward
  );
  paidReward.timestamp = event.block.timestamp;

  paidReward.save();
}

// CvxRewardPool
export function handleCvxRewardPoolRewardPaid(
  event: CvxRewardPoolRewardPaid
): void {
  const user = getUser(event.params.user);
  const cvxRewardPool = CvxRewardPool.bind(
    Address.fromString(CvxRewardPool_address)
  );
  const stakingToken = cvxRewardPool.stakingToken();
  const rewardToken = cvxRewardPool.rewardToken();
  const paidReward = getReward(
    cvxRewardPool._address,
    stakingToken,
    rewardToken,
    user
  );

  paidReward.paidAmountCumulative = paidReward.paidAmountCumulative.plus(
    event.params.reward
  );
  paidReward.timestamp = event.block.timestamp;

  paidReward.save();
}

// BaseRewardPool
export function handleCrvRewardsPoolRewardPaid(
  event: PoolCrvRewardsRewardPaid
): void {
  const context = dataSource.context();
  const user = getUser(event.params.user);
  const baseRewardPool = BaseRewardPool.bind(
    Address.fromString(context.getString("crvRewardsPool"))
  );
  const stakingToken = baseRewardPool.stakingToken();
  const rewardToken = baseRewardPool.rewardToken();
  const paidReward = getReward(
    baseRewardPool._address,
    stakingToken,
    rewardToken,
    user
  );

  paidReward.paidAmountCumulative = paidReward.paidAmountCumulative.plus(
    event.params.reward
  );
  paidReward.timestamp = event.block.timestamp;

  paidReward.save();
}
