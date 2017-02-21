let mod = {};
module.exports = mod;

mod.response = function(message) {
    let prefix = dye(CRAYON.cli, 'CLI > ');
    console.log( prefix + message );
};
mod.result = (returnVal)=>returnVal?mod.success():mod.fail();
mod.success = ()=>mod.response('Command Operate Success.');
mod.fail = ()=>mod.response('Command Operate Fail.');
//Alias
mod.help = function() {
	mod.response("Help Menu Response");
	mod.response("creep(name),alias of Game.creeps[name]");
	mod.response("spawn(setup),alias of Game.spawns['<spawnName>'].createCreepBySetup(Creep.setup.worker)");
	mod.response("recycle(name,force),recycle creep");
}
mod.creep = function(name) {
	let creep = Game.creeps[name];
	mod.result(creep);
	return creep;
};
mod.spawn = function(spawnName,setup) {
	let returnVal = Game.spawns[spawnName];
	mod.result(returnVal);
	return returnVal;
};
mod.recycle = function(name,force) {
	let returnVal;
	if(_.isUndefined(force)) {
		returnVal = Creep.action.recycling.assign(Game.creeps[name]);
	} else {
		returnVal = Game.creeps[name].data.creepType="recycler";
	}
	mod.result(returnVal);
	return returnVal;
};