let setup = new Creep.Setup('ant');
module.exports = setup;
setup.minControllerLevel = 1;
setup.default = {
    fixedBody: [TOUGH, MOVE],
    multiBody: [],
    minAbsEnergyAvailable: 60,
    minEnergyAvailable: 0.3,
    maxMulti: 0,
    maxCount: 1
};
setup.RCL = {
    1: setup.default,
    2: setup.default,
    3: setup.default,
    4: setup.default,
    5: setup.default,
    6: setup.default,
    7: setup.default,
    8: setup.default
};