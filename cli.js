let mod = {};
module.exports = mod;

mod.response = function(message) {
    let prefix = dye(CRAYON.cli, 'CLI > ');
    console.log( prefix + message );
};
mod.help = function() {
	mod.response("Help Menu Response");
	mod.response("creep(name),shorthand of Game.creeps[name]");
}
mod.creep = name=>Game.creeps[name];