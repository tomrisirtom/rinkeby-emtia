import { BigInt, Address, ethereum, log } from "@graphprotocol/graph-ts"
import {
  EmtiaTeknoloji,
  Deposit,
  EmergencyWithdraw,
  Withdraw,
  SetCall
} from "../generated/EmtiaTeknoloji/EmtiaTeknoloji"

import {
  EmtiaTeknoloji as EmtiaTeknolojiEntity,
  EmtiaTeknolojiPool,
} from "../generated/schema";

const OMUR_ADDY = '0xF26871b440E8D5a3a75c88985E220C0a5a84FE7A'

export function handleDeposit(event: Deposit): void {
  let pool = getPoolEntity(event.params.pid, event.block);
  pool.balance = pool.balance + event.params.amount;
  pool.save();
}

export function handleEmergencyWithdraw(event: EmergencyWithdraw): void {
  let pool = getPoolEntity(event.params.pid, event.block);
  pool.balance = pool.balance - event.params.amount;
  pool.save();
}

export function handleWithdraw(event: Withdraw): void {
  let pool = getPoolEntity(event.params.pid, event.block);
  pool.balance = pool.balance - event.params.amount;
  pool.save();
}

export function handleSetPoolAllocPoint(event: SetCall): void {
  let emtiaTeknoloji = EmtiaTeknoloji.bind(event.to);
  let pool = getPoolEntity(event.inputs._pid, event.block);

  // Update EmtiaTeknolojiEntity
  let emtiaTeknolojiEntity = getEmtiaTeknolojiEntity();
  emtiaTeknolojiEntity.totalAllocPoint = emtiaTeknoloji.totalAllocPoint();
  emtiaTeknolojiEntity.save();

  // Update pool
  pool.allocPoint = event.inputs._allocPoint;
  pool.save();
}

function getPoolEntity(poolId: BigInt, block: ethereum.Block): EmtiaTeknolojiPool {
  let emtiaTeknoloji = EmtiaTeknoloji.bind(Address.fromString(OMUR_ADDY));
  let pool = EmtiaTeknolojiPool.load(poolId.toString());
  let poolInfo = emtiaTeknoloji.poolInfo(poolId);

  if (pool == null) {
    // init new pool entity
    pool = new EmtiaTeknolojiPool(poolId.toString());
    pool.balance = BigInt.fromI32(0);
    pool.addedBlock = block.number;
    pool.addedTs = block.timestamp;

    //update EmtiaTeknolojiEntity
    let emtiaTeknolojiEntity = getEmtiaTeknolojiEntity();
    emtiaTeknolojiEntity.poolLength = emtiaTeknoloji.poolLength();
    emtiaTeknolojiEntity.totalAllocPoint = emtiaTeknoloji.totalAllocPoint();
    emtiaTeknolojiEntity.save()
  }

  // Update pool
  pool.lpToken = poolInfo.value0;
  pool.allocPoint = poolInfo.value1;
  pool.lastRewardBlock = poolInfo.value2;
  pool.accEmtiaPerShare = poolInfo.value3;

  pool.save()

  return pool as EmtiaTeknolojiPool;
}

function getEmtiaTeknolojiEntity(): EmtiaTeknolojiEntity {
  let entity = EmtiaTeknolojiEntity.load("1");

  if (entity == null) {
    entity = new EmtiaTeknolojiEntity("1");
    entity.totalAllocPoint = BigInt.fromI32(0);
    entity.poolLength = BigInt.fromI32(0);
    entity.save();
  }

  return entity as EmtiaTeknolojiEntity;
}
