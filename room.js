// save original API functions
let find = Room.prototype.find;

let mod = {};
module.exports = mod;

mod.extend = function(){
    let Container = function(room){
        this.room = room;

        Object.defineProperties(this, {
            'all': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this.room.memory.container)) {
                        this.room.saveContainers();
                    }
                    if( _.isUndefined(this._container) ){
                        this._container = [];
                        let add = entry => {
                            let cont = Game.getObjectById(entry.id);
                            if( cont ) {
                                _.assign(cont, entry);
                                this._container.push(cont);
                            }
                        };
                        _.forEach(this.room.memory.container, add);
                    }
                    return this._container;
                }
            },
            'controller': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this._controller) ){
                        if( this.room.my && this.room.controller.memory.storage ){
                            this._controller = [Game.getObjectById(this.room.controller.memory.storage)];
                            if( !this._controller[0] ) delete this.room.controller.memory.storage;
                        } else {
                            let byType = c => c.controller == true;
                            this._controller = _.filter(this.all, byType);
                        }
                    }
                    return this._controller;
                }
            },
            'in': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this._in) ){
                        let byType = c => c.controller == false;
                        this._in = _.filter(this.all, byType);
                        // add managed
                        let isFull = c => c.sum >= (c.storeCapacity * (1-MANAGED_CONTAINER_TRIGGER));
                        this._in = this._in.concat(this.managed.filter(isFull));
                    }
                    return this._in;
                }
            },
            'out': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this._out) ){
                        let byType = c => c.controller == true;
                        this._out = _.filter(this.all, byType);
                        // add managed
                        let isEmpty = c => c.sum <= (c.storeCapacity * MANAGED_CONTAINER_TRIGGER);
                        this._out = this._out.concat(this.managed.filter(isEmpty));
                    }
                    return this._out;
                }
            },
            'privateers': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this._privateers) ){
                        let byType = c => (c.source === false && !c.mineral && c.sum < c.storeCapacity);
                        this._privateers = _.filter(this.all, byType);
                    }
                    return this._privateers;
                }
            },
            'managed': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this._managed) ){
                        let byType = c => c.source === true && c.controller == true;
                        this._managed = _.filter(this.all, byType);
                    }
                    return this._managed;
                }
            }
        });
    };

    let Links = function(room){
        this.room = room;

        Object.defineProperties(this, {
            'all': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this.room.memory.links)) {
                        this.room.saveLinks();
                    }
                    if( _.isUndefined(this._all) ){
                        this._all = [];
                        let add = entry => {
                            let o = Game.getObjectById(entry.id);
                            if( o ) {
                                _.assign(o, entry);
                                this._all.push(o);
                            }
                        };
                        _.forEach(this.room.memory.links, add);
                    }
                    return this._all;
                }
            },
            'controller': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this._controller) ){
                        let byType = c => c.controller === true;
                        this._controller = this.all.filter(byType);
                    }
                    return this._controller;
                }
            },
            'storage': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this._storage) ) {
                        let byType = l => l.storage == true;
                        this._storage = this.all.filter(byType);
                    }
                    return this._storage;
                }
            },
            'in': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this._in) ) {
                        let byType = l => l.storage == false && l.controller == false;
                        this._in = _.filter(this.all, byType);
                    }
                    return this._in;
                }
            },
            'privateers': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this._privateers) ) {
                        let byType = l => l.storage == false && l.controller == false && l.source == false && l.energy < l.energyCapacity * 0.85;
                        this._privateers = _.filter(this.all, byType);
                    }
                    return this._privateers;
                }
            }
        });
    };

    let Structures = function(room){
        this.room = room;

        Object.defineProperties(this, {
            'all': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this._all) ){
                        this._all = this.room.find(FIND_STRUCTURES);
                    }
                    return this._all;
                }
            },
            'spawns': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this.room.memory.spawns) ) {
                        this.room.saveSpawns();
                    }
                    if( _.isUndefined(this._spawns) ){
                        this._spawns = [];
                        var addSpawn = id => { addById(this._spawns, id); };
                        _.forEach(this.room.memory.spawns, addSpawn);
                    }
                    return this._spawns;
                }
            },
            'towers': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this.room.memory.towers)) {
                        this.room.saveTowers();
                    }
                    if( _.isUndefined(this._towers) ){
                        this._towers = [];
                        var add = id => { addById(this._towers, id); };
                        _.forEach(this.room.memory.towers, add);
                    }
                    return this._towers;
                }
            },
            'repairable': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this._repairable) ){
                        let that = this;
                        this._repairable = _.sortBy(
                            that.all.filter(
                                structure => (
                                    // is not at 100%
                                    structure.hits < structure.hitsMax &&
                                    // not owned room or hits below RCL repair limit
                                    ( !that.room.my || structure.hits < MAX_REPAIR_LIMIT[that.room.controller.level] || structure.hits < (LIMIT_URGENT_REPAIRING + (2*DECAY_AMOUNT[structure.structureType] || 0))) &&
                                    // not decayable or below threshold
                                    ( !DECAYABLES.includes(structure.structureType) || (structure.hitsMax - structure.hits) > GAP_REPAIR_DECAYABLE ) &&
                                    // not pavement art
                                    ( Memory.pavementArt[that.room.name] === undefined || Memory.pavementArt[that.room.name].indexOf('x'+structure.pos.x+'y'+structure.pos.y+'x') < 0 ) && 
                                    // not flagged for removal
                                    ( !FlagDir.list.some(f => f.roomName == structure.pos.roomName && f.color == COLOR_ORANGE && f.x == structure.pos.x && f.y == structure.pos.y) )
                                )
                            ),
                            'hits'
                        );
                    }
                    return this._repairable;
                }
            },
            'urgentRepairable': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this._urgentRepairableSites) ){
                        var isUrgent = site => (site.hits < (LIMIT_URGENT_REPAIRING + (DECAY_AMOUNT[site.structureType] || 0)));
                        this._urgentRepairableSites = _.filter(this.repairable, isUrgent);
                    }
                    return this._urgentRepairableSites;
                }
            },
            'fortifyable': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this._fortifyableSites) ){
                        let that = this;
                        this._fortifyableSites = _.sortBy(
                            that.all.filter(
                                structure => (
                                    that.room.my &&
                                    structure.hits < structure.hitsMax &&
                                    structure.hits < MAX_FORTIFY_LIMIT[that.room.controller.level] &&
                                    ( structure.structureType != STRUCTURE_CONTAINER || structure.hits < MAX_FORTIFY_CONTAINER ) &&
                                    ( !DECAYABLES.includes(structure.structureType) || (structure.hitsMax - structure.hits) > GAP_REPAIR_DECAYABLE*3 ) &&
                                    ( Memory.pavementArt[that.room.name] === undefined || Memory.pavementArt[that.room.name].indexOf('x'+structure.pos.x+'y'+structure.pos.y+'x') < 0 ) && 
                                    ( !FlagDir.list.some(f => f.roomName == structure.pos.roomName && f.color == COLOR_ORANGE && f.x == structure.pos.x && f.y == structure.pos.y) )
                                )
                            ),
                            'hits'
                        );
                    }
                    return this._fortifyableSites;
                }
            },
            'fuelable': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this._fuelables) ){
                        var that = this;
                        var factor = that.room.situation.invasion ? 1 : 0.82;
                        var fuelable = target => (target.energy < (target.energyCapacity * factor));
                        this._fuelables = _.sortBy( _.filter(this.towers, fuelable), 'energy') ; // TODO: Add Nuker
                    }
                    return this._fuelables;
                }
            },
            'container' : {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this._container) ){
                        this._container = new Container(this.room);
                    }
                    return this._container;
                }
            },
            'links' : {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this._links) ){
                        this._links = new Links(this.room);
                    }
                    return this._links;
                }
            },
            'virtual': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this._virtual) ){
                        this._virtual = _(this.all).concat(this.piles);
                    }
                    return this._virtual;
                }
            },
            'piles': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this._piles) ){
                        const room = this.room;
                        this._piles = room.find(FIND_FLAGS, {filter: FLAG_COLOR.command.drop.filter})
                            .map(function(flag) {
                                const piles = room.lookForAt(LOOK_ENERGY, flag.pos.x, flag.pos.y);
                                return piles.length && piles[0] || flag;
                            });
                    }
                    return this._piles;
                }
            },
        });
    };

    Object.defineProperties(Room.prototype, {
        'structures': {
            configurable: true,
            get: function() {
                if( _.isUndefined(this._structures) ){
                    this._structures = new Structures(this);
                }
                return this._structures;
            }
        },
        'sources': {
            configurable: true,
            get: function() {
                if( _.isUndefined(this.memory.sources) || this.name == 'sim') {
                    this._sources = this.find(FIND_SOURCES);
                    if( this._sources.length > 0 ){
                        this.memory.sources = this._sources.map(s => s.id);
                    } else this.memory.sources = [];
                }
                if( _.isUndefined(this._sources) ){
                    this._sources = [];
                    var addSource = id => { addById(this._sources, id); };
                    //this.memory.sources.forEach(addSource);
                    _.forEach(this.memory.sources,addSource);
                }
                return this._sources;
            }
        },
        'droppedResources': {
            configurable: true,
            get: function() {
                if( _.isUndefined(this._droppedResources) ){
                    this._droppedResources = this.find(FIND_DROPPED_RESOURCES);
                }
                return this._droppedResources;
            }
        },
        'sourceAccessibleFields': {
            configurable: true,
            get: function() {
                if( _.isUndefined(this.memory.sourceAccessibleFields)) {
                    let sourceAccessibleFields = 0;
                    let sources = this.sources;
                    var countAccess = source => sourceAccessibleFields += source.accessibleFields;
                    _.forEach(sources, countAccess);
                    this.memory.sourceAccessibleFields = sourceAccessibleFields;
                }
                return this.memory.sourceAccessibleFields;
            }
        },
        'sourceEnergyAvailable': {
            configurable: true,
            get: function() {
                if( _.isUndefined(this._sourceEnergyAvailable) ){
                    this._sourceEnergyAvailable = 0;
                    var countEnergy = source => (this._sourceEnergyAvailable += source.energy);
                    _.forEach(this.sources, countEnergy);
                }
                return this._sourceEnergyAvailable;
            }
        },
        'ticksToNextRegeneration': {
            configurable: true,
            get: function() {
                if( _.isUndefined(this._ticksToNextRegeneration) ){
                    this._ticksToNextRegeneration = _(this.sources).map('ticksToRegeneration').min() || 0;
                }
                return this._ticksToNextRegeneration;
            }
        },
        'relativeEnergyAvailable': {
            configurable: true,
            get: function() {
                if( _.isUndefined(this._relativeEnergyAvailable) ){
                    this._relativeEnergyAvailable = this.energyCapacityAvailable > 0 ? this.energyAvailable / this.energyCapacityAvailable : 0;
                }
                return this._relativeEnergyAvailable;
            }
        },
        'reservedSpawnEnergy': {
            configurable: true,
            get: function() {
                if( _.isUndefined(this._reservedSpawnEnergy) ) {
                    this._reservedSpawnEnergy = 0;
                }
                return this._reservedSpawnEnergy;
            },
            set: function(value) {
                this._reservedSpawnEnergy = value;;
            }
        },
        'remainingEnergyAvailable': {
            configurable: true,
            get: function() {
                return this.energyAvailable - this.reservedSpawnEnergy;
            }
        },
        'relativeRemainingEnergyAvailable': {
            configurable: true,
            get: function() {
                return this.energyCapacityAvailable > 0 ? this.remainingEnergyAvailable / this.energyCapacityAvailable : 0;
            }
        },
        'towerFreeCapacity': {
            configurable: true,
            get: function() {
                if( _.isUndefined(this._towerFreeCapacity) ) {
                    this._towerFreeCapacity = 0;
                    var addFreeCapacity = tower => this._towerFreeCapacity += (tower.energyCapacity - tower.energy);
                    _.forEach(this.structures.towers, addFreeCapacity);
                }
                return this._towerFreeCapacity;
            }
        },
        'constructionSites': {
            configurable: true,
            get: function() {
                if( _.isUndefined(this._constructionSites) ) {
                    this._constructionSites = this.find(FIND_MY_CONSTRUCTION_SITES);
                }
                return this._constructionSites;
            }
        },

        'creeps': {
            configurable: true,
            get: function() {
                if( _.isUndefined(this._creeps) ){
                    this._creeps = this.find(FIND_MY_CREEPS);
                }
                return this._creeps;
            }
        },
        'allCreeps': {
            configurable: true,
            get: function() {
                if( _.isUndefined(this._allCreeps) ){
                    this._allCreeps = this.find(FIND_CREEPS);
                }
                return this._allCreeps;
            }
        },
        'hostiles': {
            configurable: true,
            get: function() {
                if( _.isUndefined(this._hostiles) ){
                    this._hostiles = this.find(FIND_HOSTILE_CREEPS, { filter : Task.reputation.hostileOwner });
                }
                return this._hostiles;
            }
        },
        'hostileIds': {
            configurable: true,
            get: function() {
                if( _.isUndefined(this._hostileIds) ){
                    this._hostileIds = _.map(this.hostiles, 'id');
                }
                return this._hostileIds;
            }
        },
        'combatCreeps': {
            configurable: true,
            get: function() {
                if( _.isUndefined(this._combatCreeps) ){
                    this._combatCreeps = this.creeps.filter( c => ['melee','ranger','healer', 'warrior'].includes(c.data.creepType) );
                }
                return this._combatCreeps;
            }
        },
        'casualties': {
            configurable: true,
            get: function() {
                if( _.isUndefined(this._casualties) ){
                    var isInjured = creep => creep.hits < creep.hitsMax &&
                        (creep.towers === undefined || creep.towers.length == 0);
                    this._casualties = _.sortBy(_.filter(this.creeps, isInjured), 'hits');
                }
                return this._casualties;
            }
        },
        'situation': {
            configurable: true,
            get: function() {
                if( _.isUndefined(this._situation) ){
                    this._situation = {
                        noEnergy: this.sourceEnergyAvailable == 0,
                        invasion: this.hostiles.length > 0 && (!this.controller || !this.controller.safeMode)
                    }
                }
                return this._situation;
            }
        },
        'roadConstructionTrace': {
            configurable: true,
            get: function () {
                if (_.isUndefined(this.memory.roadConstructionTrace) ) {
                    this.memory.roadConstructionTrace = {};
                }
                return this.memory.roadConstructionTrace;
            }
        },
        'adjacentRooms': {
            configurable: true,
            get: function () {
                if (_.isUndefined(this.memory.adjacentRooms) ) {
                    this.memory.adjacentRooms = Room.adjacentRooms(this.name);
                }
                return this.memory.adjacentRooms;
            }
        },
        'adjacentAccessibleRooms': {
            configurable: true,
            get: function () {
                if (_.isUndefined(this.memory.adjacentAccessibleRooms) ) {
                    this.memory.adjacentAccessibleRooms = Room.adjacentAccessibleRooms(this.name);
                }
                return this.memory.adjacentAccessibleRooms;
            }
        },
        'privateerMaxWeight': {
            configurable: true,
            get: function () {
                if (_.isUndefined(this._privateerMaxWeight) ) {
                    this._privateerMaxWeight = 0;
                    if ( !this.situation.invasion && !this.conserveForDefense ) {
                        let base = this.controller.level * 1000;
                        let that = this;
                        let adjacent, ownNeighbor, room, mult;

                        let flagEntries = FlagDir.filter([FLAG_COLOR.invade.robbing, FLAG_COLOR.invade.exploit]);
                        let countOwn = roomName => {
                            if( roomName == that.name ) return;
                            if( Room.isMine(roomName) ) ownNeighbor++;
                        };
                        let calcWeight = flagEntry => {
                            if( !this.adjacentAccessibleRooms.includes(flagEntry.roomName) ) return;
                            room = Game.rooms[flagEntry.roomName];
                            if( room ) {
                                adjacent = room.adjacentAccessibleRooms;
                                mult = room.sources.length;
                            } else {
                                adjacent = Room.adjacentAccessibleRooms(flagEntry.roomName);
                                mult = 1;
                            }
                            ownNeighbor = 1;
                            adjacent.forEach(countOwn);
                            that._privateerMaxWeight += (mult * base / ownNeighbor);
                        };
                        flagEntries.forEach(calcWeight);
                    }
                };
                return this._privateerMaxWeight;
            }
        },
        'claimerMaxWeight': {
            configurable: true,
            get: function () {
                if (_.isUndefined(this._claimerMaxWeight) ) {
                    this._claimerMaxWeight = 0;
                    let base = 1250;
                    let maxRange = 2;
                    let that = this;
                    let distance, reserved, flag;
                    let rcl = this.controller.level;

                    let flagEntries = FlagDir.filter([FLAG_COLOR.claim, FLAG_COLOR.claim.reserve, FLAG_COLOR.invade.exploit]);
                    let calcWeight = flagEntry => {
                        // don't spawn claimer for reservation at RCL < 4 (claimer not big enough)
                        if( rcl > 3 || (flagEntry.color == FLAG_COLOR.claim.color && flagEntry.secondaryColor == FLAG_COLOR.claim.secondaryColor )) {
                            distance = Room.roomDistance(that.name, flagEntry.roomName);
                            if( distance > maxRange )
                                return;
                            flag = Game.flags[flagEntry.name];
                            if( flag.room && flag.room.controller && flag.room.controller.reservation && flag.room.controller.reservation.ticksToEnd > 2500)
                                return;

                            reserved = flag.targetOf && flag.targetOf ? _.sum( flag.targetOf.map( t => t.creepType == 'claimer' ? t.weight : 0 )) : 0;
                            that._claimerMaxWeight += (base - reserved);
                        };
                    };
                    flagEntries.forEach(calcWeight);
                };
                return this._claimerMaxWeight;
            }
        },
        'conserveForDefense': {
            configurable: true,
            get: function () {
                return (this.my && this.storage && this.storage.store.energy < MIN_STORAGE_ENERGY[this.controller.level]);
            }
        },
        'hostileThreatLevel': {
            configurable: true,
            get: function () {
                if (_.isUndefined(this._hostileThreatLevel) ) {
                    // TODO: add towers when in foreign room
                    this._hostileThreatLevel = 0;
                    let evaluateBody = creep => {
                        this._hostileThreatLevel += creep.threat;
                    };
                    this.hostiles.forEach(evaluateBody);
                }
                return this._hostileThreatLevel;
            }
        },
        'defenseLevel': {
            configurable: true,
            get: function () {
                if (_.isUndefined(this._defenseLevel) ) {
                    this._defenseLevel = {
                        towers: 0,
                        creeps: 0,
                        sum: 0
                    }
                    let evaluate = creep => {
                        this._defenseLevel.creeps += creep.threat;
                    };
                    this.combatCreeps.forEach(evaluate);
                    this._defenseLevel.towers = this.structures.towers.length;
                    this._defenseLevel.sum = this._defenseLevel.creeps + (this._defenseLevel.towers * Creep.partThreat.tower);
                }
                return this._defenseLevel;
            }
        },
        'minerals': {
            configurable:true,
            get: function () {
                if( _.isUndefined(this.memory.minerals)) {
                    this.saveMinerals();
                }
                if( _.isUndefined(this._minerals) ){
                    this._minerals = [];
                    let add = id => { addById(this._minerals, id); };
                    this.memory.minerals.forEach(add);
                }
                return this._minerals;
            }
        },
        'mineralType': {
            configurable:true,
            get: function () {
                if( _.isUndefined(this.memory.mineralType)) {
                    let minerals = this.find(FIND_MINERALS);
                    if( minerals && minerals.length > 0 )
                        this.memory.mineralType = minerals[0].mineralType;
                    else this.memory.mineralType = '';
                }
                return this.memory.mineralType;
            }
        },
        'costMatrix': {
            configurable: true,
            get: function () {
                if( _.isUndefined(Memory.pathfinder)) Memory.pathfinder = {};
                if( _.isUndefined(Memory.pathfinder[this.name])) Memory.pathfinder[this.name] = {};

                const ttl = Game.time - Memory.pathfinder[this.name].updated;
                if( Memory.pathfinder[this.name].costMatrix && ttl < COST_MATRIX_VALIDITY) {
                    if( DEBUG && TRACE ) trace('PathFinder', {roomName:this.name, ttl, PathFinder:'CostMatrix'}, 'cached costmatrix');
                    return PathFinder.CostMatrix.deserialize(Memory.pathfinder[this.name].costMatrix);
                }

                if( DEBUG ) logSystem(this.name, 'Calulating cost matrix');
                var costMatrix = new PathFinder.CostMatrix;
                let setCosts = structure => {
                    if(structure.structureType == STRUCTURE_ROAD) {
                        costMatrix.set(structure.pos.x, structure.pos.y, 1);
                    } else if(structure.structureType !== STRUCTURE_RAMPART || !structure.isPublic ) {
                        costMatrix.set(structure.pos.x, structure.pos.y, 0xFF);
                    }
                };
                this.structures.all.forEach(setCosts);

                const prevTime = Memory.pathfinder[this.name].updated;
                Memory.pathfinder[this.name].costMatrix = costMatrix.serialize();
                Memory.pathfinder[this.name].updated = Game.time;
                if( DEBUG && TRACE ) trace('PathFinder', {roomName:this.name, prevTime, structures:this.structures.all.length, PathFinder:'CostMatrix'}, 'updated costmatrix');
                return costMatrix;
            }
        },
        'currentCostMatrix': {
            configurable: true,
            get: function () {
                if (_.isUndefined(this._currentCostMatrix) ) {
                    let costs = this.costMatrix;
                    // Avoid creeps in the room
                    this.allCreeps.forEach(function(creep) {
                        costs.set(creep.pos.x, creep.pos.y, 0xff);
                    });
                    this._currentCostMatrix = costs;
                }
                return this._currentCostMatrix;
            }
        },
        'my': {
            configurable: true,
            get: function () {
                if (_.isUndefined(this._my) ) {
                    this._my = this.controller && this.controller.my;
                }
                return this._my;
            }
        },
        'reserved': {
            configurable: true,
            get: function () {
                if (_.isUndefined(this._reserved) ) {
                    if (this.controller) {
                        const myName = _.find(Game.spawns).owner.username;
                        this._reserved = this.controller.my || (this.controller.reservation
                            && this.controller.reservation.username === myName);
                    } else {
                        this._reserved = false;
                    }
                }
                return this._reserved;
            },
        },
        'owner': {
            configurable: true,
            get: function () {
                if (_.isUndefined(this._owner)) {
                    if (this.controller && this.controller.owner) {
                        this._owner = this.controller.owner.username;
                    } else {
                        this._owner = false;
                    }
                }
                return this._owner;
            },
        },
        'reservation': {
            configurable: true,
            get: function () {
                if (_.isUndefined(this._reservation)) {
                    if (this.controller && this.controller.reservation) {
                        this._reservation = this.controller.reservation.username;
                    } else {
                        this._reservation = false;
                    }
                }
                return this._reservation;
            },
        },
        'ally': {
            configurable: true,
            get: function () {
                if (_.isUndefined(this._ally)) {
                    if (this.reserved) {
                        this._ally = true;
                    } else if (this.controller) {
                        this._ally = Task.reputation.isAlly(this.owner) || Task.reputation.isAlly(this.reservation);
                    } else {
                        this._ally = false;
                    }
                }
                return this._ally;
            },
        },
        'spawnQueueHigh': {
            configurable: true,
            get: function() {
                if( _.isUndefined(this.memory.spawnQueueHigh) ) {
                    this.memory.spawnQueueHigh = [];
                }
                return this.memory.spawnQueueHigh;
            }
        },
        'spawnQueueMedium': {
            configurable: true,
            get: function() {
                if( _.isUndefined(this.memory.spawnQueueMedium) ) {
                    this.memory.spawnQueueMedium = [];
                }
                return this.memory.spawnQueueMedium;
            }
        },
        'spawnQueueLow': {
            configurable: true,
            get: function() {
                if( _.isUndefined(this.memory.spawnQueueLow) ) {
                    this.memory.spawnQueueLow = [];
                }
                return this.memory.spawnQueueLow;
            }
        },
        'pavementArt': {
            configurable: true,
            get: function() {
                if( _.isUndefined(this.memory.pavementArt) ) {
                    this.memory.pavementArt = [];
                }
                return this.memory.pavementArt;
            }
        },
        'collapsed': {
            configurable: true,
            get: function() {
                if( _.isUndefined(this._collapsed) ) {
                    // only if owned
                    if( !this.my ) {
                        this._collapsed = false;
                        return;
                    }
                    // no creeps ? collapsed!
                    if( !this.population ) {
                        this._collapsed = true;
                        return;
                    }
                    // is collapsed if workers + haulers + pioneers in room = 0
                    let workers = this.population.typeCount['worker'] ? this.population.typeCount['worker'] : 0;
                    let haulers = this.population.typeCount['hauler'] ? this.population.typeCount['hauler'] : 0;
                    let pioneers = this.population.typeCount['pioneer'] ? this.population.typeCount['pioneer'] : 0;
                    this._collapsed = (workers + haulers + pioneers) === 0;
                }
                return this._collapsed;
            }
        },
    });

    Room.prototype.find = function (c, opt) {
        if (_.isArray(c)) {
            return _(c)
                .map(x => find.call(this, x, opt))
                .flatten()
                .value();
        } else
            return find.apply(this, arguments);
    };

    Room.prototype.findRoute = function(targetRoomName, checkOwner = true, preferHighway = true){
        if (this.name == targetRoomName)  return [];

        return Game.map.findRoute(this, targetRoomName, {
            routeCallback(roomName) {
                if( roomName !== targetRoomName && ROUTE_ROOM_COST[roomName]) {
                    return ROUTE_ROOM_COST[roomName];
                }
                let isHighway = false;
                if( preferHighway ){
                    let parsed = /^[WE]([0-9]+)[NS]([0-9]+)$/.exec(roomName);
                    isHighway = (parsed[1] % 10 === 0) || (parsed[2] % 10 === 0);
                }
                let isMyOrNeutralRoom = false;
                if( checkOwner ){
                    let room = Game.rooms[roomName];
                    isMyOrNeutralRoom = room &&
                        room.controller &&
                        (room.controller.my ||
                        (room.controller.owner === undefined));
                }

                if (isMyOrNeutralRoom || roomName == targetRoomName)
                    return 1;
                else if (isHighway)
                    return 3;
                else if( Game.map.isRoomAvailable(roomName))
                    return (checkOwner || preferHighway) ? 11 : 1;
                return Infinity;
            }
        });
    };

    Room.prototype.getBestConstructionSiteFor = function(pos, filter = null) {
        let sites;
        if( filter ) sites = this.constructionSites.filter(filter);
        else sites = this.constructionSites;
        if( sites.length == 0 ) return null;
        let siteOrder = CONSTRUCTION_PRIORITY;
        let rangeOrder = site => {
            let order = siteOrder.indexOf(site.structureType); 
            return pos.getRangeTo(site) + ( order < 0 ? 100000 : (order * 100) );
            //if( order < 0 ) return 100000 + pos.getRangeTo(site);
            //return ((order - (site.progress / site.progressTotal)) * 100) + pos.getRangeTo(site);
        };
        return _.min(sites, rangeOrder);
    };

    Room.prototype.roadConstruction = function( minDeviation = ROAD_CONSTRUCTION_MIN_DEVIATION ) {

        //TODO imporve road construction in mining room
        let roomCenterPos = new RoomPosition(25, 25, this.name);
        let isMiningFlag = (flag) => ( flag.color == FLAG_COLOR.claim.mining.color && flag.secondaryColor == FLAG_COLOR.claim.mining.secondaryColor );
        let flag = FlagDir.find(isMiningFlag, roomCenterPos, true);
        let buildMiningRoad = (ROAD_CONSTRUCTION_ENABLE_MINING && flag);
        if(!buildMiningRoad) {
            if( !ROAD_CONSTRUCTION_ENABLE || Game.time % ROAD_CONSTRUCTION_INTERVAL != 0 ) return;
            if( _.isNumber(ROAD_CONSTRUCTION_ENABLE) && (!this.my || ROAD_CONSTRUCTION_ENABLE > this.controller.level)) return;
        }
        let siteTotal = _.size(Game.constructionSites);
        let siteCanCreate = Math.min(80-siteTotal,30); //Only place new road when total amount below 80 
        if(siteCanCreate<=0) return; //No space for new road

        let data = Object.keys(this.roadConstructionTrace)
            .map( k => {
                return { // convert to [{key,n,x,y}]
                    'n': this.roadConstructionTrace[k], // count of steps on x,y cordinates
                    'x': k.charCodeAt(0)-32, // extract x from key
                    'y': k.charCodeAt(1)-32 // extraxt y from key
                };
            });

        let min = Math.max(ROAD_CONSTRUCTION_ABS_MIN, (data.reduce( (_sum, b) => _sum + b.n, 0 ) / data.length) * minDeviation);
        data = data.filter( e => {
            if (e.n >= min) {
                let structures = this.lookForAt(LOOK_STRUCTURES,e.x,e.y);
                return (structures.length === 0 || structures[0].structureType === STRUCTURE_RAMPART)
                    && this.lookForAt(LOOK_CONSTRUCTION_SITES,e.x,e.y).length === 0;
            } else {
                return false;
            }
        });

        // build roads on all most frequent used fields
        let setSite = pos => {
            if( DEBUG ) logSystem(this.name, `Constructing new road at ${pos.x}'${pos.y} (${pos.n} traces)`);
            if((siteCanCreate--)>0) this.createConstructionSite(pos.x, pos.y, STRUCTURE_ROAD);
        };
        _.forEach(data, setSite);

        // clear old data
        this.roadConstructionTrace = {};
    };
    Room.prototype.recordMove = function(creep){
        if( !ROAD_CONSTRUCTION_ENABLE ) return;
        let x = creep.pos.x;
        let y = creep.pos.y;
        if ( x == 0 || y == 0 || x == 49 || y == 49 ||
            creep.carry.energy == 0 || creep.data.actionName == 'building' )
            return;

        let key = `${String.fromCharCode(32+x)}${String.fromCharCode(32+y)}_x${x}-y${y}`;
        if( !this.roadConstructionTrace[key] )
            this.roadConstructionTrace[key] = 1;
        else this.roadConstructionTrace[key]++;
    };

    Room.prototype.saveTowers = function(){
        let towers = this.find(FIND_MY_STRUCTURES, {
            filter: {structureType: STRUCTURE_TOWER}
        });
        if( towers.length > 0 ){
            var id = obj => obj.id;
            this.memory.towers = _.map(towers, id);
        } else this.memory.towers = [];
    };
    Room.prototype.saveSpawns = function(){
        let spawns = this.find(FIND_MY_SPAWNS);
        if( spawns.length > 0 ){
            let id = o => o.id;
            this.memory.spawns = _.map(spawns, id);
        } else this.memory.spawns = [];
    };
    Room.prototype.saveContainers = function(){
        this.memory.container = [];
        let containers = this.structures.all.filter(
            structure => structure.structureType == STRUCTURE_CONTAINER
        );
        let add = (cont) => {
            let minerals = this.find(FIND_MINERALS);
            let source = cont.pos.findInRange(this.sources, 2);
            let mineral = cont.pos.findInRange(minerals, 2);
            this.memory.container.push({
                id: cont.id,
                source: (source.length > 0),
                controller: ( cont.pos.getRangeTo(this.controller) < 4 ),
                mineral: (mineral.length > 0),
            });
            let assignContainer = s => s.memory.container = cont.id;
            source.forEach(assignContainer);
            mineral.forEach(assignContainer);
        };
        containers.forEach(add);

        if( this.terminal ) {
            // terminal in range <= 2 is too simplistic for certain room placements near sources. See #681
            // This solution finds all walkable source fields in a room, then compares adjacency with the terminal
            // The first room position adjacent to the terminal is remapped back to it's adjacent source for mapping to terminal
            let minerSpots = [];
            let findValidFields = s => { minerSpots = _(minerSpots).concat(Room.validFields(this.name, s.pos.x-1, s.pos.x+1, s.pos.y-1, s.pos.y+1, true)); };
            _.forEach(this.sources, findValidFields);
            let sourceField = this.terminal.pos.findClosestByRange(minerSpots, 1);
            let source = [];
            if(sourceField){
                if(this.sources.length == 1){
                    source = this.sources;
                } else {
                    source.push( sourceField.isNearTo(this.sources[0]) ? this.sources[0] : this.sources[1] );
                }
            }
           
            let mineral = this.terminal.pos.findInRange(this.minerals, 2);
            let assignTerminal = s => s.memory.terminal = this.terminal.id;
            source.forEach(assignTerminal);
            mineral.forEach(assignTerminal);
        }
        if( this.storage ) {
            let source = this.storage.pos.findInRange(this.sources, 2);
            let mineral = this.storage.pos.findInRange(this.minerals, 2);
            let assignStorage = s => s.memory.storage = this.storage.id;
            source.forEach(assignStorage);
            mineral.forEach(assignStorage);

            if( this.storage.pos.getRangeTo(this.controller) < 4 )
                this.controller.memory.storage = this.storage.id;
        }
    };
    Room.prototype.saveLinks = function(){
        if( _.isUndefined(this.memory.links) ){
            this.memory.links = [];
        }
        let links = this.find(FIND_MY_STRUCTURES, {
            filter: (structure) => ( structure.structureType == STRUCTURE_LINK )
        });
        let storageLinks = this.storage ? this.storage.pos.findInRange(links, 2).map(l => l.id) : [];

        // for each memory entry, keep if existing
        /*
        let kept = [];
        let keep = (entry) => {
            if( links.find( (c) => c.id == entry.id )){
                entry.storage = storageLinks.includes(entry.id);
                kept.push(entry);
            }
        };
        this.memory.links.forEach(keep);
        this.memory.links = kept;
        */
        this.memory.links = [];

        // for each link add to memory ( if not contained )
        let add = (link) => {
            if( !this.memory.links.find( (l) => l.id == link.id ) ) {
                let isControllerLink = ( link.pos.getRangeTo(this.controller) < 4 );
                let isSource = false;
                if( !isControllerLink ) {
                    let source = link.pos.findInRange(this.sources, 2);
                    let assign = s => s.memory.link = link.id;
                    source.forEach(assign);
                    isSource = source.length > 0;
                }
                this.memory.links.push({
                    id: link.id,
                    storage: storageLinks.includes(link.id),
                    controller: isControllerLink,
                    source: isSource
                });
            }
        };
        links.forEach(add);
    };
    Room.prototype.saveMinerals = function() {
        let that = this;
        let toPos = o => {
            return {
                x: o.pos.x,
                y: o.pos.y
            };
        };
        let extractorPos = this.structures.all.filter(
            structure => structure.structureType == STRUCTURE_EXTRACTOR
        ).map(toPos);
        let hasExtractor = m => _.some(extractorPos, {
            x: m.pos.x,
            y: m.pos.y
        });
        this._minerals = this.find(FIND_MINERALS).filter(hasExtractor);
        if( this._minerals.length > 0 ){
            let id = o => o.id;
            this.memory.minerals = _.map(that._minerals, id);
        } else this.memory.minerals = [];
    };

    Room.prototype.linkDispatcher = function () {
        let filled = l => l.cooldown == 0 && l.energy >= (l.energyCapacity * (l.source ? 0.85 : 0.5));
        let empty = l =>  l.energy < l.energyCapacity * 0.15;
        let filledIn = this.structures.links.in.filter(filled);
        let emptyController = this.structures.links.controller.filter(empty);

        if( filledIn.length > 0  ){
            let emptyStorage = this.structures.links.storage.filter(empty);

            let handleFilledIn = f => { // first fill controller, then storage
                if( emptyController.length > 0 ){
                    f.transferEnergy(emptyController[0]);
                    emptyController.shift();
                } else if( emptyStorage.length > 0 ){
                    f.transferEnergy(emptyStorage[0]);
                    emptyStorage.shift();
                }
            }
            filledIn.forEach(handleFilledIn);
        }

        if( emptyController.length > 0 ){ // controller still empty, send from storage
            let filledStorage = this.structures.links.storage.filter(filled);
            let handleFilledStorage = f => {
                if( emptyController.length > 0 ){
                    f.transferEnergy(emptyController[0]);
                    emptyController.shift();
                }
            }
            filledStorage.forEach(handleFilledStorage);
        }
    };
    Room.prototype.terminalBroker = function () {
        if( !this.my || !this.terminal ) return;
        let that = this;
        let mineral = this.mineralType;
        let transacting = false;
        let terminalFull = (this.terminal.sum / this.terminal.storeCapacity) > 0.8;
        if( this.terminal.store[mineral] >= MIN_MINERAL_SELL_AMOUNT ) {
            let orders = Game.market.getAllOrders( o => {
                if( !o.roomName ||
                    o.resourceType != mineral ||
                    o.type != 'buy' ||
                    o.amount < MIN_MINERAL_SELL_AMOUNT ) return false;

                o.range = Game.map.getRoomLinearDistance(o.roomName, that.name, true);
                o.transactionAmount = Math.min(o.amount, that.terminal.store[mineral]);
                o.transactionCost = Game.market.calcTransactionCost(
                    o.transactionAmount,
                    that.name,
                    o.roomName);
                if(o.transactionCost > that.terminal.store.energy && o.transactionAmount > MIN_MINERAL_SELL_AMOUNT) {
                    // cant afford. try min amount
                    o.transactionAmount = MIN_MINERAL_SELL_AMOUNT;
                    o.transactionCost = Game.market.calcTransactionCost(
                        o.transactionAmount,
                        that.name,
                        o.roomName);
                }

                o.credits = o.transactionAmount*o.price;
                //o.ratio = o.credits/o.transactionCost; // old formula
                //o.ratio = (o.credits-o.transactionCost)/o.transactionAmount; // best offer assuming 1e == 1 credit
                //o.ratio = o.credits/(o.transactionAmount+o.transactionCost); // best offer assuming 1e == 1 mineral
                o.ratio = (o.credits - (o.transactionCost*ENERGY_VALUE_CREDITS)) / o.transactionAmount; // best offer assuming 1e == ENERGY_VALUE_CREDITS credits

                return (
                    (terminalFull || o.ratio >= MIN_SELL_RATIO[mineral]) &&
                    //o.range <= MAX_SELL_RANGE &&
                    o.transactionCost <= that.terminal.store.energy);
            });

            if( orders.length > 0 ){
                let order = _.max(orders, 'ratio');
                let result = Game.market.deal(order.id, order.transactionAmount, that.name);
                if( DEBUG || SELL_NOTIFICATION ) logSystem(that.name, `Selling ${order.transactionAmount} ${mineral} for ${order.credits} (${order.price} ¢/${mineral}, ${order.transactionCost} e): ${translateErrorCode(result)}`);
                if( SELL_NOTIFICATION ) Game.notify( `<h2>Room ${that.name} executed an order!</h2><br/>Result: ${translateErrorCode(result)}<br/>Details:<br/>${JSON.stringify(order).replace(',',',<br/>')}` );
                transacting = result == OK;
            }
        }
        if( this.controller.level == 8 && !transacting &&
            this.storage.store.energy > MAX_STORAGE_ENERGY[this.controller.level] * 0.8 &&
            this.terminal.store[mineral] < 150000 &&
            this.terminal.store.energy > 55000 ){
            let requiresEnergy = room => (
                room.my &&
                room.controller.level < 8 &&
                room.storage && room.terminal &&
                room.terminal.sum < room.terminal.storeCapacity - 50000 &&
                room.storage.sum < room.storage.storeCapacity * 0.8 &&
                !room._isReceivingEnergy
            )
            let targetRoom = _.min(_.filter(Game.rooms, requiresEnergy), 'storage.store.energy');
            if( targetRoom && Game.market.calcTransactionCost(50000, this.name, targetRoom.name) < (this.terminal.store.energy-50000)) {
                targetRoom._isReceivingEnergy = true;
                let response = this.terminal.send('energy', 50000, targetRoom.name, 'have fun');
                if( DEBUG ) logSystem(that.name, `Transferring 50k energy to ${targetRoom.name}: ${translateErrorCode(response)}`);
            }
        }
    };
    Room.prototype.processInvaders = function(){
        let that = this;
        if( this.memory.hostileIds === undefined )
            this.memory.hostileIds = [];
        if( this.memory.statistics === undefined)
            this.memory.statistics = {};

        let registerHostile = creep => {
            if(creep.owner.username == "Source Keeper") return;
            // if invader id unregistered
            if( !that.memory.hostileIds.includes(creep.id) ){
                // handle new invader
                // register 
                that.memory.hostileIds.push(creep.id);
                // save to trigger subscribers later
                that.newInvader.push(creep)
                // create statistics
                if( SEND_STATISTIC_REPORTS ) {
                    let bodyCount = JSON.stringify( _.countBy(creep.body, 'type') );
                    if(that.memory.statistics.invaders === undefined)
                        that.memory.statistics.invaders = [];
                    that.memory.statistics.invaders.push({
                        owner: creep.owner.username,
                        id: creep.id,
                        body: bodyCount,
                        enter: Game.time,
                        time: Date.now()
                    });
                }
            }
        }
        _.forEach(this.hostiles, registerHostile);

        let registerHostileLeave = id => {
            // for each known invader
            if( !that.hostileIds.includes(id) ) { // not found anymore
                // save to trigger subscribers later
                that.goneInvader.push(id)
                // update statistics
                if( SEND_STATISTIC_REPORTS && that.memory.statistics && that.memory.statistics.invaders !== undefined && that.memory.statistics.invaders.length > 0 ){
                    let select = invader => invader.id == id && invader.leave === undefined;
                    let entry = _.find(that.memory.statistics.invaders, select);
                    if( entry != undefined ) entry.leave = Game.time;
                }
            }
        }
        _.forEach(this.memory.hostileIds, registerHostileLeave);

        this.memory.hostileIds = this.hostileIds;
    };
};
mod.flush = function(){
    let clean = room => {
        delete room._sourceEnergyAvailable;
        delete room._droppedResources;
        delete room._ticksToNextRegeneration;
        delete room._relativeEnergyAvailable;
        delete room._towerFreeCapacity;
        delete room._hostiles;
        delete room._hostileIds;
        delete room._situation;
        delete room._casualties;
        delete room._currentCostMatrix;
        delete room._isReceivingEnergy;
        delete room._reservedSpawnEnergy;
        delete room._creeps
        delete room._privateerMaxWeight;
        delete room._claimerMaxWeight;
        delete room._combatCreeps;
        delete room._defenseLevel;
        delete room._hostileThreatLevel;
        delete room._collapsed;
        if( global.isNewServer ) {
            delete room._my;
            delete room._constructionSites;
            delete room._maxPerJob;
            delete room._minerals;
            delete room._structures;
        } else {
            delete room.structures._repairable;
            delete room.structures._urgentRepairableSites;
            delete room.structures._fortifyableSites;
            delete room.structures._fuelables;
        }
        room.newInvader = [];
        room.goneInvader = [];
    };
    _.forEach(Game.rooms, clean);
};
mod.analyze = function(){
    let getEnvironment = room => {
        try {
            if( Game.time % MEMORY_RESYNC_INTERVAL == 0 || room.name == 'sim' ) {
                room.saveMinerals();
                room.saveTowers();
                room.saveSpawns();
                room.saveContainers();
                room.saveLinks();
                room.terminalBroker();
            }
            room.roadConstruction();
            room.linkDispatcher();
            room.processInvaders();
        }
        catch(err) {
            Game.notify('Error in room.js (Room.prototype.loop) for "' + room.name + '" : ' + err.stack ? err + '<br/>' + err.stack : err);
            console.log( dye(CRAYON.error, 'Error in room.js (Room.prototype.loop) for "' + room.name + '": <br/>' + (err.stack || err.toString()) + '<br/>' + err.stack));
        }
    };
    _.forEach(Game.rooms, getEnvironment);        
};
mod.execute = function() {
    let triggerNewInvaders = creep => {
        // create notification
        let bodyCount = JSON.stringify( _.countBy(creep.body, 'type') );
        if( DEBUG || NOTIFICATE_INVADER || (NOTIFICATE_INTRUDER && creep.room.my) || NOTIFICATE_HOSTILES ) logSystem(creep.pos.roomName, `Hostile intruder (${bodyCount}) from "${creep.owner.username}.`);
        if( NOTIFICATE_INVADER || (NOTIFICATE_INTRUDER && creep.owner.username !== 'Invader' && creep.room.my) || (NOTIFICATE_HOSTILES && creep.owner.username !== 'Invader') ){
            Game.notify(`Hostile intruder ${creep.id} (${bodyCount}) from "${creep.owner.username}" in room ${creep.pos.roomName} at ${toDateTimeString(toLocalDate(new Date()))}`);
        }
        // trigger subscribers
        Room.newInvader.trigger(creep);
    }
    let triggerKnownInvaders = id =>  Room.knownInvader.trigger(id);
    let triggerGoneInvaders = id =>  Room.goneInvader.trigger(id);
    let run = (memory, roomName) => {
        let room = Game.rooms[roomName];
        if( room ){ // has sight
            room.goneInvader.forEach(triggerGoneInvaders);
            room.hostileIds.forEach(triggerKnownInvaders);
            room.newInvader.forEach(triggerNewInvaders);
            Tower.loop(room);
            if( room.collapsed ) Room.collapsed.trigger(room);
        }
        else { // no sight
            if( memory.hostileIds ) _.forEach(memory.hostileIds, triggerKnownInvaders);
        }
    };
    _.forEach(Memory.rooms, run);
};

mod.bestSpawnRoomFor = function(targetRoomName) {
    var range = room => room.my ? routeRange(room.name, targetRoomName) : Infinity;
    return _.min(Game.rooms, range);
};
// find a room to spawn
// params: { targetRoom, minRCL = 0, maxRange = Infinity, minEnergyAvailable = 0, minEnergyCapacity = 0, callBack = null, allowTargetRoom = false, rangeRclRatio = 3, rangeQueueRatio = 51 }
// requiredParams: targetRoom
mod.findSpawnRoom = function(params){
    if( !params || !params.targetRoom ) return null;
    // filter validRooms
    let isValidRoom = room => (
        room.my && 
        (params.minEnergyCapacity === undefined || params.minEnergyCapacity <= room.energyCapacityAvailable) &&
        (params.minEnergyAvailable === undefined || params.minEnergyAvailable <= room.energyAvailable) &&
        (room.name != params.targetRoom || params.allowTargetRoom === true) &&
        (params.minRCL === undefined || room.controller.level >= params.minRCL) && 
        (params.callBack === undefined || params.callBack(room)) 
    );
    let validRooms = _.filter(Game.rooms, isValidRoom);
    if( validRooms.length == 0 ) return null;
    // select "best"
    // range + roomLevelsUntil8/rangeRclRatio + spawnQueueDuration/rangeQueueRatio
    let queueTime = queue => _.sum(queue, c => (c.parts.length*3));
    let roomTime = room => ((queueTime(room.spawnQueueLow)*0.9) + queueTime(room.spawnQueueMedium) + (queueTime(room.spawnQueueHigh)*1.1) ) / room.structures.spawns.length;
    let evaluation = room => { return routeRange(room.name, params.targetRoom) +
        ( (8-room.controller.level) / (params.rangeRclRatio||3) ) + 
        ( roomTime(room) / (params.rangeQueueRatio||51) );
    }
    return _.min(validRooms, evaluation);
};
mod.getCostMatrix = function(roomName) {
    var room = Game.rooms[roomName];
    if(!room) return;
    return room.costMatrix;
};
mod.isMine = function(roomName) {
    let room = Game.rooms[roomName];
    return( room && room.my );
};

mod.calcCoordinates = function(roomName, callBack){
    let parsed = /^[WE]([0-9]+)[NS]([0-9]+)$/.exec(roomName);
    let x = parsed[1] % 10;
    let y = parsed[2] % 10;
    if( callBack ) return callBack(x,y);
    return null;
}
mod.isCenterRoom = function(roomName){
    return Room.calcCoordinates(roomName, (x,y) => {
        return x === 5 && y === 5;
    });
};
mod.isCenterNineRoom = function(roomName){
    return Room.calcCoordinates(roomName, (x,y) => {
        return x > 3 && x < 7 && y > 3 && y < 7;
    });
};
mod.isControllerRoom = function(roomName){
    return Room.calcCoordinates(roomName, (x,y) => {
        return x !== 0 && y !== 0 && (x < 4 || x > 6 || y < 4 || y > 6);
    });
};
mod.isSKRoom = function(roomName){
    return Room.calcCoordinates(roomName, (x,y) => {
        return (x > 3 || x < 7) && (y > 3 || y < 7) && (x !== 5 || y !== 5);
    });
};
mod.isHighwayRoom = function(roomName){
    return Room.calcCoordinates(roomName, (x,y) => {
        return x === 0 || y === 0;
    });
};
mod.adjacentRooms = function(roomName){
    let parts = roomName.split(/([N,E,S,W])/);
    let dirs = ['N','E','S','W'];
    let toggle = q => dirs[ (dirs.indexOf(q)+2) % 4 ];
    let names = [];
    for( let x = parseInt(parts[2])-1; x < parseInt(parts[2])+2; x++ ){
        for( let y = parseInt(parts[4])-1; y < parseInt(parts[4])+2; y++ ){
            names.push( ( x < 0 ? toggle(parts[1]) + '0' : parts[1] + x ) + ( y < 0 ? toggle(parts[3]) + '0' : parts[3] + y ) );
        }
    }
    return names;
};
mod.adjacentAccessibleRooms = function(roomName, diagonal = true) {
    let validRooms = [];
    let exits = Game.map.describeExits(roomName);
    let addValidRooms = (roomName, direction) => {
        if( diagonal ) {
            let roomExits = Game.map.describeExits(roomName);
            let dirA = (direction + 1) % 8 + 1;
            let dirB = (direction + 5) % 8 + 1;
            if( roomExits && roomExits[dirA] && !validRooms.includes(roomExits[dirA]) )
                validRooms.push(roomExits[dirA]);
            if( roomExits && roomExits[dirB] && !validRooms.includes(roomExits[dirB]) )
                validRooms.push(roomExits[dirB]);
        }
        validRooms.push(roomName);
    }
    _.forEach(exits, addValidRooms);
    return validRooms;
};
mod.roomDistance = function(roomName1, roomName2, diagonal, continuous){
    if( diagonal ) return Game.map.getRoomLinearDistance(roomName1, roomName2, continuous);
    if( roomName1 == roomName2 ) return 0;
    let posA = roomName1.split(/([N,E,S,W])/);
    let posB = roomName2.split(/([N,E,S,W])/);
    let xDif = posA[1] == posB[1] ? Math.abs(posA[2]-posB[2]) : posA[2]+posB[2]+1;
    let yDif = posA[3] == posB[3] ? Math.abs(posA[4]-posB[4]) : posA[4]+posB[4]+1;
    //if( diagonal ) return Math.max(xDif, yDif); // count diagonal as 1
    return xDif + yDif; // count diagonal as 2
};
mod.getCostMatrix = function(roomName) {
    var room = Game.rooms[roomName];
    if(!room) return;
    return room.costMatrix;
};
mod.validFields = function(roomName, minX, maxX, minY, maxY, checkWalkable = false, where = null) {
    let look;
    if( checkWalkable ) {
        look = Game.rooms[roomName].lookAtArea(minY,minX,maxY,maxX);
    }
    let invalidObject = o => {
        return ((o.type == LOOK_TERRAIN && o.terrain == 'wall') ||
            // o.type == LOOK_CONSTRUCTION_SITES ||
            (o.type == LOOK_STRUCTURES && OBSTACLE_OBJECT_TYPES.includes(o.structure.structureType) ));
    };
    let isWalkable = (posX, posY) => look[posY][posX].filter(invalidObject).length == 0;

    let fields = [];
    for( let x = minX; x <= maxX; x++) {
        for( let y = minY; y <= maxY; y++){
            if( x > 1 && x < 48 && y > 1 && y < 48 ){
                if( !checkWalkable || isWalkable(x,y) ){
                    let p = new RoomPosition(x, y, roomName);
                    if( !where || where(p) )
                        fields.push(p);
                }
            }
        }
    }
    return fields;
};
// args = { spots: [{pos: RoomPosition, range:1}], checkWalkable: false, where: ()=>{}, roomName: abc ) }
mod.fieldsInRange = function(args) {
    let plusRangeX = args.spots.map(spot => spot.pos.x + spot.range);
    let plusRangeY = args.spots.map(spot => spot.pos.y + spot.range);
    let minusRangeX = args.spots.map(spot => spot.pos.x - spot.range);
    let minusRangeY = args.spots.map(spot => spot.pos.y - spot.range);
    let minX = Math.max(...minusRangeX);
    let maxX = Math.min(...plusRangeX);
    let minY = Math.max(...minusRangeY);
    let maxY = Math.min(...plusRangeY);
    return Room.validFields(args.roomName, minX, maxX, minY, maxY, args.checkWalkable, args.where);
};
