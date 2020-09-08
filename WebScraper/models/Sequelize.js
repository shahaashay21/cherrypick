var sequelize = new Sequelize('cherrypick', 'root', 'root', {
    host: 'localhost',
    dialect: 'mysql',

    pool: {
        max: 5,
        min: 0,
        idle: 10000
    },
    define: {
        timestamps: true
    }
});