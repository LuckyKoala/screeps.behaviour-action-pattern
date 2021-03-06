module.exports = class Visuals {
	
	static run() {
		for (let roomName in Game.rooms) {
			const room = Game.rooms[roomName];
			if (VISUALS.CREEP) {
				Visuals.drawCreepPath(room);
			}
			if (!room.my) continue; // Skip rooms not owned by you
			
			if (Memory.heatmap === undefined) Memory.heatmap = false;
			
			if (VISUALS.HEATMAP) {
				if (Game.time % VISUALS.HEATMAP_INTERVAL === 0) {
					Visuals.setHeatMapData(room);
				}
				
				if (Memory.heatmap) {
					Visuals.drawHeatMapData(room);
					continue;
				}
			}
			
			if (VISUALS.ROOM) {
				Visuals.drawRoomInfo(room, VISUALS.ROOM_GLOBAL);
			}
			if (VISUALS.CONTROLLER) {
				Visuals.drawControllerInfo(room.controller);
			}
			if (VISUALS.SPAWN) {
				room.structures.spawns.filter(s => s.spawning).forEach(s => Visuals.drawSpawnInfo(s));
			}
			if (VISUALS.MINERAL) {
				let [mineral] = room.minerals;
				if (mineral) Visuals.drawMineralInfo(mineral);
			}
			if (VISUALS.SOURCE) {
				room.sources.forEach(s => Visuals.drawSourceInfo(s));
			}
			if (VISUALS.WALL) {
				Visuals.highlightWeakest(room, STRUCTURE_WALL);
			}
			if (VISUALS.RAMPART) {
				Visuals.highlightWeakest(room, STRUCTURE_RAMPART);
			}
			if (VISUALS.ROAD) {
				Visuals.highlightWeakest(room, STRUCTURE_ROAD);
			}
			if (VISUALS.STORAGE) {
				Visuals.storage(room);
			}
			if (VISUALS.TERMINAL) {
				Visuals.terminal(room);
			}
		}
	}
	
	static drawRoomInfo(room) {
		const vis = new RoomVisual(room.name);
		let x;
		let y = 0;
		// Room Name, centered middle
		vis.text(`Room: ${vis.roomName}`, 24.5, ++y);
		// Display bars: RCL, GCL, CPU, Bucket, Tick #
		const bufferWidth = 1;
		const sectionWidth = 49 / 5;
		const BAR_STYLE = {fill: '#2B2B2B', opacity: 0.8, stroke: '#000000',};
		
		// RCL
		x = bufferWidth;
		vis.rect(x, ++y - 0.75, sectionWidth, 1, BAR_STYLE);
		const RCL_PERCENTAGE = room.controller.progress / room.controller.progressTotal;
		vis.rect(x, y - 0.75, RCL_PERCENTAGE * sectionWidth, 1, {fill: getColourByPercentage(RCL_PERCENTAGE, true), opacity: BAR_STYLE.opacity});
		vis.text(`RCL: ${room.controller.level} (${(RCL_PERCENTAGE * 100).toFixed(2)}%)`, x + sectionWidth / 2, y);
		if (VISUALS.ROOM_GLOBAL) {
			// GCL
			x = bufferWidth * 2 + sectionWidth;
			vis.rect(x, y - 0.75, sectionWidth, 1, BAR_STYLE);
			const GCL_PERCENTAGE = Game.gcl.progress / Game.gcl.progressTotal;
			vis.rect(x, y - 0.75, GCL_PERCENTAGE * sectionWidth, 1, {
				fill: getColourByPercentage(GCL_PERCENTAGE, true),
				opacity: BAR_STYLE.opacity
			});
			vis.text(`GCL: ${Game.gcl.level} (${(GCL_PERCENTAGE * 100).toFixed(2)}%)`, x + sectionWidth / 2, y);
			
			// CPU
			x += sectionWidth + bufferWidth;
			vis.rect(x, y - 0.75, sectionWidth, 1, BAR_STYLE);
			const CPU_PERCENTAGE = Game.cpu.getUsed() / Game.cpu.limit;
			const FUNCTIONAL_CPU_PERCENTAGE = CPU_PERCENTAGE > 1 ? 1 : CPU_PERCENTAGE;
			vis.rect(x, y - 0.75, FUNCTIONAL_CPU_PERCENTAGE * sectionWidth, 1, {
				fill: getColourByPercentage(FUNCTIONAL_CPU_PERCENTAGE),
				opacity: BAR_STYLE.opacity
			});
			vis.text(`CPU: ${(CPU_PERCENTAGE * 100).toFixed(2)}%`, x + sectionWidth / 2, y);
			
			// Bucket
			x += sectionWidth + bufferWidth;
			vis.rect(x, y - 0.75, sectionWidth, 1, BAR_STYLE);
			const BUCKET_PERCENTAGE = Game.cpu.bucket / 10000;
			vis.rect(x, y - 0.75, BUCKET_PERCENTAGE * sectionWidth, 1, {
				fill: getColourByPercentage(BUCKET_PERCENTAGE, true),
				opacity: BAR_STYLE.opacity
			});
			vis.text(`Bucket: ${Game.cpu.bucket}`, x + sectionWidth / 2, y);
			
			// Tick
			x += sectionWidth + bufferWidth;
			vis.text(`Tick: ${Game.time}`, x, y, {align: 'left'});
			
			// New line
			y += 1.5;
			
			x = bufferWidth;
		} else {
			x += sectionWidth + bufferWidth;
		}
		
		// Display Creep Count, Energy Available
		vis.rect(x, y - 0.75, sectionWidth, 1, BAR_STYLE);
		const ENERGY_PERCENTAGE = room.energyAvailable / room.energyCapacityAvailable;
		vis.rect(x, y - 0.75, ENERGY_PERCENTAGE * sectionWidth, 1, {fill: getColourByPercentage(ENERGY_PERCENTAGE, true), opacity: BAR_STYLE.opacity});
		vis.text(`Energy: ${room.energyAvailable}/${room.energyCapacityAvailable} (${(ENERGY_PERCENTAGE * 100).toFixed(2)}%)`, x + sectionWidth / 2, y);
	}
	
	static drawSpawnInfo(spawn) {
		if (!spawn.spawning) return;
		const vis = new RoomVisual(spawn.room.name);
		vis.text(`${spawn.spawning.name} (${((spawn.spawning.needTime - spawn.spawning.remainingTime) / spawn.spawning.needTime * 100).toFixed(1)}%)`, spawn.pos.x + 1, spawn.pos.y - 0.5, {align: 'left', font: 0.4,});
	}
	
	static drawMineralInfo(mineral) {
		const vis = new RoomVisual(mineral.room.name);
		let x = mineral.pos.x + 1;
		let y = mineral.pos.y - 0.5;
		if (mineral.mineralAmount) {
			vis.text(`Amount: ${formatNum(mineral.mineralAmount)}`, x, y, {align: 'left', font: 0.4,});
		} else {
			vis.text(`Regen: ${formatNum(mineral.ticksToRegeneration)}`, x, y, {align: 'left', font: 0.4,});
		}
	}
	
	static drawSourceInfo(source) {
		const vis = new RoomVisual(source.room.name);
		let x = source.pos.x + 0.5;
		let y = source.pos.y - 0.5;
		if (source.energy) {
			vis.text(`Amount: ${source.energy}`, x, y, {align: 'left', font: 0.4,});
		} else {
			vis.text(`Regen: ${source.ticksToRegeneration}`, x, y, {align: 'left', font: 0.4,});
		}
	}
	
	static drawControllerInfo(controller) {
		const vis = new RoomVisual(controller.room.name);
		const BASE_X = controller.pos.x + 1;
		let y = controller.pos.y - 0.5;
		const style = {align: 'left', font: 0.4,};
		vis.text(`L: ${controller.level}`, BASE_X, y, style);
		vis.text(`P: ${formatNum(controller.progress)}/${formatNum(controller.progressTotal)} (${(controller.progress / controller.progressTotal * 100).toFixed(2)}%)`, BASE_X, y += 0.4, style);
		if (controller.ticksToDowngrade < CONTROLLER_DOWNGRADE[controller.level]) {
			let downgradeStyle = Object.assign({}, style, {color: '#FF0000'});
			vis.text(`D: ${formatNum(controller.ticksToDowngrade)}`, BASE_X, y += 0.4, downgradeStyle);
		}
	}
	
	static highlightWeakest(room, type) {
		const vis = new RoomVisual(room.name);
		let weakest = _(room.find(FIND_STRUCTURES)).filter(s => s.structureType === type).min(s => s.hits);
		if (weakest && weakest.pos) {
			vis.circle(weakest.pos.x, weakest.pos.y, {radius: 0.4, fill: '#FF0000', opacity: 0.3, strokeWidth: 0,});
			vis.text(`H: ${formatNum(weakest.hits)} (${(weakest.hits / weakest.hitsMax * 100).toFixed(2)}%)`, weakest.pos.x + 0.5, weakest.pos.y - 0.1, {align: 'left', font: 0.4,});
		}
	}
	
	static storage(room) {
		if (room.storage) {
			const vis = new RoomVisual(room.name);
			const x = 43;
			let y = 4.5;
			vis.text('Storage Contents', x, ++y, {align: 'left'});
			storageObject(vis, room.storage.store, x, y);
		}
	}
	
	static terminal(room) {
		if (room.terminal) {
			const vis = new RoomVisual(room.name);
			const x = 43;
			let y = 4.5;
			if (VISUALS.STORAGE && room.storage) {
				y += 2 + _.size(room.storage.store) * 0.6;
			}
			vis.text('Terminal Contents', x, ++y, {align: 'left'});
			storageObject(vis, room.terminal.store, x, y);
		}
	}
	
	static setHeatMapData(room) {
		if (room.memory.heatmap === undefined) {
			room.memory.heatmap = {};
			for (let x = 0; x < 50; x++) {
				for (let y = 0; y < 50; y++) {
					const look = room.lookForAt(LOOK_TERRAIN, x, y);
					if (look && look[0] === 'wall') continue;
					const key = `${String.fromCharCode(32+x)}${String.fromCharCode(32+y)}_x${x}-y${y}`;
					room.memory.heatmap[key] = 0;
				}
			}
		}
		room.creeps.filter(creep => !creep.spawning).forEach(creep => {
			const x = creep.pos.x;
			const y = creep.pos.y;
			const key = `${String.fromCharCode(32+x)}${String.fromCharCode(32+y)}_x${x}-y${y}`;
			room.memory.heatmap[key]++;
		});
	}
	
	static drawHeatMapData(room) {
		const vis = new RoomVisual(room.name);
		const data = Object.keys(room.memory.heatmap).map(k => {
			return {
				n: room.memory.heatmap[k],
				x: k.charCodeAt(0) - 32,
				y: k.charCodeAt(1) - 32,
			};
		});
		
		const MAP_DATA = _.filter(data, d => d.n > 0);
		
		const PERCENTAGE_MAX = _.sum(MAP_DATA, d => d.n) / MAP_DATA.length * 2;
		MAP_DATA.forEach(d => {
			const PERCENTAGE = d.n / PERCENTAGE_MAX;
			const colour = getColourByPercentage(PERCENTAGE > 1 ? 1 : PERCENTAGE);
			vis.rect(d.x - 0.5, d.y - 0.5, 1, 1, {fill: colour});
		});
	}
	
	static creepPathStyle(creep) {
		function randomColour() {
			let c = '#';
			while (c.length < 7) {
				c += (Math.random()).toString(16).substr(-6).substr(-1);
			}
			return c;
		}
		
		creep.data.pathColour = creep.data.pathColour ? creep.data.pathColour : randomColour(); // set colour in memory. Makes tracking easier, and prevents rainbows.
		return {
			width: 0.15,
			color: creep.data.pathColour,
			lineStyle: 'dashed',
		};
	}
	
	static drawCreepPath(room) {
		const vis = new RoomVisual(room.name);
		room.creeps.forEach(creep => {
			if (creep.data && creep.data.path) {
				let path = creep.data.path;
				const style = Visuals.creepPathStyle(creep);
				let x = creep.pos.x;
				let y = creep.pos.y;
				if (creep.fatigue === 0) {
					path = path.substr(1); // remove initial direction to prevent drawing behind creep
					
					const initDirection = +creep.data.path[0]; // get initial so we know where to set the start (x, y)
					if (initDirection === TOP) {
						--y;
					} else if (initDirection === TOP_RIGHT) {
						++x;
						--y;
					} else if (initDirection === RIGHT) {
						++x;
					} else if (initDirection === BOTTOM_RIGHT) {
						++x;
						++y;
					} else if (initDirection === BOTTOM) {
						++y;
					} else if (initDirection === BOTTOM_LEFT) {
						--x;
						++y;
					} else if (initDirection === LEFT) {
						--x;
					} else if (initDirection === TOP_LEFT) {
						--x;
						--y;
					} else {
						// we're not supposed to be here.
					}
				}
				for (let direction of path) {
					direction = +direction; // force coerce to number
					if (direction === TOP) {
						vis.line(x, y, x, --y, style);
					} else if (direction === TOP_RIGHT) {
						vis.line(x, y, ++x, --y, style);
					} else if (direction === RIGHT) {
						vis.line(x, y, ++x, y, style);
					} else if (direction === BOTTOM_RIGHT) {
						vis.line(x, y, ++x, ++y, style);
					} else if (direction === BOTTOM) {
						vis.line(x, y, x, ++y, style);
					} else if (direction === BOTTOM_LEFT) {
						vis.line(x, y, --x, ++y, style);
					} else if (direction === LEFT) {
						vis.line(x, y, --x, y, style);
					} else if (direction === TOP_LEFT) {
						vis.line(x, y, --x, --y, style);
					} else {
						// we're not supposed to be here.
					}
				}
			}
		});
	}
	
};

function formatNum(n) {
	if (n >= 1000000) {
		return (n / 1000000).toFixed(2) + 'M';
	} else if (n >= 1000) {
		return (n / 1000).toFixed(1) + 'K';
	}
	return n;
}

function storageObject(vis, store, x, startY) {
	Object.keys(store).forEach(resource => vis.text(`${resource}: ${formatNum(store[resource])}`, x, startY += 0.6, {align: 'left', font: 0.5, color: getResourceColour(resource)}));
}

function getResourceColour(resourceType) {
	const BASE = {
		[RESOURCE_ENERGY]: '#FFE56D',
		[RESOURCE_POWER]: '#FF0000',
		[RESOURCE_CATALYST]: '#FF7A7A',
		[RESOURCE_GHODIUM]: '#FFFFFF',
		[RESOURCE_HYDROGEN]: '#CCCCCC',
		[RESOURCE_KEANIUM]: '#9370FF',
		[RESOURCE_LEMERGIUM]: '#89F4A5',
		[RESOURCE_OXYGEN]: '#CCCCCC',
		[RESOURCE_UTRIUM]: '#88D6F7',
		[RESOURCE_ZYNTHIUM]: '#F2D28B',
	};
	
	let colour = BASE[resourceType];
	
	if (!colour) {
		let compoundType = [RESOURCE_UTRIUM, RESOURCE_LEMERGIUM, RESOURCE_KEANIUM, RESOURCE_ZYNTHIUM, RESOURCE_GHODIUM, RESOURCE_HYDROGEN, RESOURCE_OXYGEN].find(type => resourceType.indexOf(type) !== -1);
		colour = BASE[compoundType];
	}
	return colour;
}

function getColourByPercentage(percentage, reverse = false) {
	const value = reverse ? percentage : 1 - percentage;
	const hue = (value * 120).toString(10);
	return `hsl(${hue}, 100%, 50%)`;
}