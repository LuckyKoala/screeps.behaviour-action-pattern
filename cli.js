let mod = {};
module.exports = mod;

mod.response = function(roomName, message) {
    let text = dye(CRAYON.system, roomName);
    console.log( dye(CRAYON.system, message) );
};
mod.help = function() {
	mod.response("Help Menu Response");
	mod.response("creep(name),shorthand of Game.creeps[name]");
}
mod.creep = name=>Game.creeps[name];