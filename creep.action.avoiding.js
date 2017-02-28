let action = new Creep.Action('avoiding');
module.exports = action;
action.lairDangerTime = 7;
action.targetRange = 0;
action.reachedRange = 0;
action.isActiveLair = function(target) {
    return !(target.ticksToSpawn > action.lairDangerTime); // non-lair => true
};
action.isValidAction = function(creep){
    return creep.data.destiny && creep.data.destiny.room === creep.room.name &&
        (Room.isSKRoom(creep.room.name) || creep.room.situation.invasion);
};
action.isAddableAction = function(creep) {
    return true;
};
action.isValidTarget = function(target, creep){
    return Task.reputation.hostileOwner(target) || action.isActiveLair(target);
};
//TODO optimize about fleeMove so it will calculate too many time.
action.newTarget = function(creep) {
    if (Room.isSKRoom(creep.pos.roomName)) {
        let targets = creep.pos.findInRange(FIND_HOSTILE_STRUCTURES, 5, {
            filter: function(o) {
                return o.structureType===STRUCTURE_KEEPER_LAIR && action.isActiveLair(o);
            }
        });
        return targets[0];
    }

    if (creep.room.situation.invasion) {
        return creep.room.hostiles[0];
    }
};
action.work = function(creep) {
    if(!creep.target) return;
    if(creep.target instanceof StructureKeeperLair) {
        creep.fleeMove(creep.target);
    } else {
        creep.fleeMove();
    }
    return OK;
};
action.step = function(creep) {
    //
};
action.onAssignment = function(creep, target) {
    delete creep.data.safeSpot;
    if( SAY_ASSIGNMENT ) creep.say(String.fromCharCode(10532), SAY_PUBLIC);
};