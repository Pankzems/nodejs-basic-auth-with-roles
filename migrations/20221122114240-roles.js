module.exports = {
  async up(db, client) {
    // TODO write your migration here.
    // See https://github.com/seppevs/migrate-mongo/#creating-a-new-migration-script
    // Example:
    // await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: true}});
    const roles = [
        {
            "title": "Superadmin",
            "slug": "superadmin",
            "active": true
        },
        {
            "title": "Admin",
            "slug": "admin",
            "active": true
        },
        {
            "title": "Editor",
            "slug": "editor",
            "active": true
        },
        {
            "title": "Reader",
            "slug": "reader",
            "active": true
        }
    ];
    return db.collection('roles').insertMany(roles);
    
  },

  async down(db, client) {
    // TODO write the statements to rollback your migration (if possible)
    // Example:
    // await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: false}});
  }
};
