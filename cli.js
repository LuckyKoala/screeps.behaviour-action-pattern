let mod = {};
module.exports = mod;

mod.response = function(message) {
    let prefix = dye(CRAYON.cli, 'CLI > ');
    console.log( prefix + message );
};
mod.result = (returnVal)=>returnVal?mod.success():mod.fail();
mod.success = ()=>mod.response('Command Operate Success.');
mod.fail = ()=>mod.response('Command Operate Fail.');

mod.help = function() {
	mod.response("Help Menu Response");
	mod.response("creep(name),shorthand of Game.creeps[name]");
	mod.response("spawn(setup),shorthand of Game.spawns['<spawnName>'].createCreepBySetup(Creep.setup.worker)");
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