let mod = {};
module.exports = mod;
mod.name = 'ant';
mod.run = function(creep) {
    //Manul
    if( creep.action && creep.target ) {
        creep.action.step(creep);
    }
};
mod.nextAction = function(creep) {
    //
};