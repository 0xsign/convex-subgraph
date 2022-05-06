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
  vlCvxExtraRewardDistributionOld,
  RewardPaid as vlCvxExtraRewardDistributionOldRewardPaid,
} from "../generated/vlCvxExtraRewardDistributionOld/vlCvxExtraRewardDistributionOld";
import {
  vlCvxExtraRewardDistribution,
  RewardPaid as vlCvxExtraRewardDistributionRewardPaid,
} from "../generated/vlCvxExtraRewardDistribution/vlCvxExtraRewardDistribution";
import {
  vlCvxExtraRewardDistributionV2,
  RewardPaid as vlCvxExtraRewardDistributionV2RewardPaid,
} from "../generated/vlCvxExtraRewardDistributionV2/vlCvxExtraRewardDistributionV2";
import {
  ConvexMasterChef,
  RewardPaid as ConvexMasterChefRewardPaid,
} from "../generated/ConvexMasterChef/ConvexMasterChef";
import { RewardPaid as CvxCrvRewardRewardPaid } from "../generated/CvxCrvReward/BaseRewardPool";
import {
  ConvexRewarder,
  RewardPaid as ConvexRewarderRewardPaid,
} from "../generated/ConvexRewarder/ConvexRewarder";
import {
  AddExtraRewardCall,
  BaseRewardPool,
  RewardPaid as PoolCrvRewardsRewardPaid,
} from "../generated/templates/CrvRewardsPool/BaseRewardPool";
import {
  AddPoolCall,
  Booster,
  RewardClaimedCall,
} from "../generated/Booster/Booster";
import { Platform, Reward, User, PlatformReward } from "../generated/schema";
import {
  CrvRewardsPool,
  VirtualBalanceRewardPoolTemplate,
} from "../generated/templates";
import {
  VirtualBalanceRewardPool,
  RewardPaid as VirtualBalanceRewardPoolRewardPaid,
} from "../generated/templates/VirtualBalanceRewardPoolTemplate/VirtualBalanceRewardPool";

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
const ConvexRewarder_address = "0x1fd97b5e5a257b0b9b9a42a96bb8870cbdd1eb79";
const CvxCrvReward_address = "0x3fe65692bfcd0e6cf84cb1e7d24108e434a7587e";
const Cvx_address = "0x4e3fbd56cd56c3e72c1403e103b45db9da5b9d2b";
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
// Track new pools and start listening to their events
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

// Mint CVX
// Called by BaseRewardPool#getReward
export function handleRewardClaimed(call: RewardClaimedCall): void {
  const platform = getPlatform(platform_curve);
  const booster = Booster.bind(Address.fromString(Booster_address));
  const user = getUser(call.inputs._address);

  // success
  if (call.outputs.value0) {
    let poolAddress: Address | null = null;

    const cvxCrvRewardAddress = Address.fromString(CvxCrvReward_address);
    // handle CvxCrvReward (pid 0) manually because it's not in Booster#poolInfo array (poolInfo[0] is another BaseRewardPool)
    if (call.from.equals(cvxCrvRewardAddress)) {
      poolAddress = cvxCrvRewardAddress;
    } else {
      const poolInfo = booster.try_poolInfo(call.inputs._pid);
      if (!poolInfo.reverted) {
        poolAddress = poolInfo.value.value3;
      }
    }

    if (!poolAddress) {
      return;
    }

    const baseRewardPool = BaseRewardPool.bind(poolAddress);
    const stakingToken = baseRewardPool.stakingToken();
    const rewardToken = Address.fromString(Cvx_address);
    const reward = getReward(
      platform,
      user,
      baseRewardPool._address,
      stakingToken,
      rewardToken
    );
    const platformReward = getPlatformReward(
      platform,
      baseRewardPool._address,
      stakingToken,
      rewardToken
    );

    reward.paidAmountCumulative = reward.paidAmountCumulative.plus(
      call.inputs._amount
    );
    reward.timestamp = call.block.timestamp;

    platformReward.paidAmountCumulative = platformReward.paidAmountCumulative.plus(
      call.inputs._amount
    );
    platformReward.timestamp = call.block.timestamp;

    reward.save();
    platformReward.save();
  }
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
  const platformReward = getPlatformReward(
    platform,
    cvxLockerOld._address,
    stakingToken,
    event.params._rewardsToken
  );

  reward.paidAmountCumulative = reward.paidAmountCumulative.plus(
    event.params._reward
  );
  reward.timestamp = event.block.timestamp;

  platformReward.paidAmountCumulative = platformReward.paidAmountCumulative.plus(
    event.params._reward
  );
  platformReward.timestamp = event.block.timestamp;

  reward.save();
  platformReward.save();
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
  const platformReward = getPlatformReward(
    platform,
    cvxLocker._address,
    stakingToken,
    event.params._rewardsToken
  );

  reward.paidAmountCumulative = reward.paidAmountCumulative.plus(
    event.params._reward
  );
  reward.timestamp = event.block.timestamp;

  platformReward.paidAmountCumulative = platformReward.paidAmountCumulative.plus(
    event.params._reward
  );
  platformReward.timestamp = event.block.timestamp;

  reward.save();
  platformReward.save();
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
  const platformReward = getPlatformReward(
    platform,
    cvxLockerV2._address,
    stakingToken,
    event.params._rewardsToken
  );

  reward.paidAmountCumulative = reward.paidAmountCumulative.plus(
    event.params._reward
  );
  reward.timestamp = event.block.timestamp;

  platformReward.paidAmountCumulative = platformReward.paidAmountCumulative.plus(
    event.params._reward
  );
  platformReward.timestamp = event.block.timestamp;

  reward.save();
  platformReward.save();
}

// vlCvxExtraRewardDistributionOld
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
  const platformReward = getPlatformReward(
    platform,
    _vlCvxExtraRewardDistributionOld._address,
    stakingToken,
    event.params._rewardsToken
  );

  reward.paidAmountCumulative = reward.paidAmountCumulative.plus(
    event.params._reward
  );
  reward.timestamp = event.block.timestamp;

  platformReward.paidAmountCumulative = platformReward.paidAmountCumulative.plus(
    event.params._reward
  );
  platformReward.timestamp = event.block.timestamp;

  reward.save();
  platformReward.save();
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
  const platformReward = getPlatformReward(
    platform,
    _vlCvxExtraRewardDistribution._address,
    stakingToken,
    event.params._rewardsToken
  );

  reward.paidAmountCumulative = reward.paidAmountCumulative.plus(
    event.params._reward
  );
  reward.timestamp = event.block.timestamp;

  platformReward.paidAmountCumulative = platformReward.paidAmountCumulative.plus(
    event.params._reward
  );
  platformReward.timestamp = event.block.timestamp;

  reward.save();
  platformReward.save();
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
  const platformReward = getPlatformReward(
    platform,
    _vlCvxExtraRewardDistributionV2._address,
    stakingToken,
    event.params._rewardsToken
  );

  reward.paidAmountCumulative = reward.paidAmountCumulative.plus(
    event.params._reward
  );
  reward.timestamp = event.block.timestamp;

  platformReward.paidAmountCumulative = platformReward.paidAmountCumulative.plus(
    event.params._reward
  );
  platformReward.timestamp = event.block.timestamp;

  reward.save();
  platformReward.save();
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
  const platformReward = getPlatformReward(
    platform,
    cvxRewardPool._address,
    stakingToken,
    rewardToken
  );

  reward.paidAmountCumulative = reward.paidAmountCumulative.plus(
    event.params.reward
  );
  reward.timestamp = event.block.timestamp;

  platformReward.paidAmountCumulative = platformReward.paidAmountCumulative.plus(
    event.params.reward
  );
  platformReward.timestamp = event.block.timestamp;

  reward.save();
  platformReward.save();
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
  const platformReward = getPlatformReward(
    platform,
    convexMasterChef._address,
    stakingToken,
    rewardToken
  );

  reward.paidAmountCumulative = reward.paidAmountCumulative.plus(
    event.params.amount
  );
  reward.timestamp = event.block.timestamp;

  platformReward.paidAmountCumulative = platformReward.paidAmountCumulative.plus(
    event.params.amount
  );
  platformReward.timestamp = event.block.timestamp;

  reward.save();
  platformReward.save();
}

// VirtualBalanceRewardPool
export function handleVirtualBalanceRewardPoolRewardPaid(
  event: VirtualBalanceRewardPoolRewardPaid
): void {
  const context = dataSource.context();
  const user = getUser(event.params.user);
  const platform = getPlatform(platform_curve);
  const virtualBalanceRewardPool = VirtualBalanceRewardPool.bind(
    Address.fromString(context.getString("virtualBalanceRewardPool"))
  );
  const deposits = BaseRewardPool.bind(virtualBalanceRewardPool.deposits());
  const stakingToken = deposits.stakingToken();
  const rewardToken = virtualBalanceRewardPool.rewardToken();
  const reward = getReward(
    platform,
    user,
    virtualBalanceRewardPool._address,
    stakingToken,
    rewardToken
  );
  const platformReward = getPlatformReward(
    platform,
    virtualBalanceRewardPool._address,
    stakingToken,
    rewardToken
  );

  reward.paidAmountCumulative = reward.paidAmountCumulative.plus(
    event.params.reward
  );
  reward.timestamp = event.block.timestamp;

  platformReward.paidAmountCumulative = platformReward.paidAmountCumulative.plus(
    event.params.reward
  );
  platformReward.timestamp = event.block.timestamp;

  reward.save();
  platformReward.save();
}

// CvxCrvReward
// Custom treatment because Booster doesn't create it
// Besides the address of the pool is missing from the context
export function handleCvxCrvRewardRewardPaid(
  event: CvxCrvRewardRewardPaid
): void {
  const user = getUser(event.params.user);
  const platform = getPlatform(platform_curve);
  const cvxCrvRewardPool = BaseRewardPool.bind(
    Address.fromString(CvxCrvReward_address)
  );
  const stakingToken = cvxCrvRewardPool.stakingToken();
  const rewardToken = cvxCrvRewardPool.rewardToken();
  const reward = getReward(
    platform,
    user,
    cvxCrvRewardPool._address,
    stakingToken,
    rewardToken
  );
  const platformReward = getPlatformReward(
    platform,
    cvxCrvRewardPool._address,
    stakingToken,
    rewardToken
  );

  reward.paidAmountCumulative = reward.paidAmountCumulative.plus(
    event.params.reward
  );
  reward.timestamp = event.block.timestamp;

  platformReward.paidAmountCumulative = platformReward.paidAmountCumulative.plus(
    event.params.reward
  );
  platformReward.timestamp = event.block.timestamp;

  reward.save();
  platformReward.save();
}

// ConvexRewarder
export function handleConvexRewarderRewardPaid(
  event: ConvexRewarderRewardPaid
): void {
  const user = getUser(event.params.user);
  const platform = getPlatform(platform_curve);
  const convexRewarder = ConvexRewarder.bind(
    Address.fromString(ConvexRewarder_address)
  );
  const stakingToken = convexRewarder.stakingToken();
  const rewardToken = convexRewarder.rewardToken();
  const reward = getReward(
    platform,
    user,
    convexRewarder._address,
    stakingToken,
    rewardToken
  );
  const platformReward = getPlatformReward(
    platform,
    convexRewarder._address,
    stakingToken,
    rewardToken
  );

  reward.paidAmountCumulative = reward.paidAmountCumulative.plus(
    event.params.reward
  );
  reward.timestamp = event.block.timestamp;

  platformReward.paidAmountCumulative = platformReward.paidAmountCumulative.plus(
    event.params.reward
  );
  platformReward.timestamp = event.block.timestamp;

  reward.save();
  platformReward.save();
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
  const platformReward = getPlatformReward(
    platform,
    baseRewardPool._address,
    stakingToken,
    rewardToken
  );

  reward.paidAmountCumulative = reward.paidAmountCumulative.plus(
    event.params.reward
  );
  reward.timestamp = event.block.timestamp;

  platformReward.paidAmountCumulative = platformReward.paidAmountCumulative.plus(
    event.params.reward
  );
  platformReward.timestamp = event.block.timestamp;

  reward.save();
  platformReward.save();
}

// ExtraRewards
export function handleAddExtraReward(call: AddExtraRewardCall): void {
  const context = dataSource.context();
  // success
  if (call.outputs.value0) {
    context.setString(
      "virtualBalanceRewardPool",
      call.inputs._reward.toHexString()
    );
    VirtualBalanceRewardPoolTemplate.createWithContext(
      call.inputs._reward,
      context
    );
  }
}
