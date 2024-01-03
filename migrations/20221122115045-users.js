const bcrypt = require("bcryptjs");

module.exports = {
  async up(db, client) {
    // TODO write your migration here.
    // See https://github.com/seppevs/migrate-mongo/#creating-a-new-migration-script
    // Example:
    // await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: true}});

    const password = await bcrypt.hash("admin@123", 12);
    const users = [
        {
            "firstname": "Superadmin",
            "email": "admin@admin.com",
            "phone": "1234567890",
            "password": password,
            "roles": ["superadmin","admin","editor","reader"],
            "active": true
        }
    ];
    return db.collection('users').insertMany(users);
  },

  async down(db, client) {
    // TODO write the statements to rollback your migration (if possible)
    // Example:
    // await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: false}});
  }
};
