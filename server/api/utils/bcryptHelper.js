const bcrypt = require('bcrypt');
const saltRounds = 10;

exports.hashPassword = async (password) => {
    return await bcrypt.hash(password, saltRounds);
};

exports.comparePassword = async (password, hash) => {
    return await bcrypt.compare(password, hash);
};
