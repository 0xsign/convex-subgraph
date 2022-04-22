import {
  dataSource,
  Address,
  BigInt,
  DataSourceContext,
} from "@graphprotocol/graph-ts";
import { RewardPaid as CvxLockerRewardPaid } from "../generated/CvxLocker/CvxLocker";
import { CvxRewardPool, RewardPaid as CvxRewardPoolRewardPaid } from "../generated/CvxRewardPool/CvxRewardPool";
import { RewardPaid as vlCvxExtraRewardDistributionRewardPaid } from "../generated/vlCvxExtraRewardDistribution/vlCvxExtraRewardDistribution";
import {
  BaseRewardPool,
  RewardPaid as PoolCrvRewardsRewardPaid,
} from "../generated/templates/PoolCrvRewards/BaseRewardPool";
import { AddPoolCall, Booster } from "../generated/Booster/Booster";
import { Platform, Reward, User } from "../generated/schema";
import { CrvRewardsPool } from "../generated/templates";

const Booster_address = "0xf403c135812408bfbe8713b5a23a04b3d48aae31";
const vlCvxExtraRewardDistribution_address =
  "0xDecc7d761496d30F30b92Bdf764fb8803c79360D";
const CvxLocker_address = "0xD18140b4B819b895A3dba5442F959fA44994AF50";
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
  tokenAddress: Address,
  user: User
): Reward {
  const id = poolAddress.toHexString() + "-" + tokenAddress.toHexString() + "-" + user.id;
  let reward = Reward.load(id);

  if (!reward) {
    reward = new Reward(id);
    reward.pool = poolAddress;
    reward.token = tokenAddress;
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
  const pool = Address.fromString(CvxLocker_address);
  const user = getUser(event.params._user);
  const paidReward = getReward(pool, event.params._rewardsToken, user);

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
  const pool = Address.fromString(vlCvxExtraRewardDistribution_address);
  const user = getUser(event.params._user);
  const paidReward = getReward(pool, event.params._rewardsToken, user);

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
  const pool = Address.fromString(CvxRewardPool_address);
  const cvxRewardPool = CvxRewardPool.bind(pool);
  const rewardToken = cvxRewardPool.rewardToken();
  const paidReward = getReward(pool, rewardToken, user);

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
  const crvRewardsPoolAddress = Address.fromString(
    context.getString("crvRewardsPool")
  );
  const baseRewardPool = BaseRewardPool.bind(crvRewardsPoolAddress);
  const rewardToken = baseRewardPool.rewardToken();
  const paidReward = getReward(crvRewardsPoolAddress, rewardToken, user);

  paidReward.paidAmountCumulative = paidReward.paidAmountCumulative.plus(
    event.params.reward
  );
  paidReward.timestamp = event.block.timestamp;

  paidReward.save();
}
