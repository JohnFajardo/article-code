exports.seed = function (knex) {
  // Deletes ALL existing entries
  return knex('comments').del()
    .then(function () {
      // Inserts seed entries
      return knex('comments').insert([
        { user_id: 1, post_id: 1, body: 'Far far away, behind the word mountains, far from the countries Vokalia and Consonantia, there live the blind texts.' },
        { user_id: 1, post_id: 1, body: 'The European languages are members of the same family. Their separate existence is a myth. For science, music, sport, etc.' },
        { user_id: 1, post_id: 1, body: 'But I must explain to you how all this mistaken idea of denouncing pleasure and praising pain was born and I will give you a complete account of the system.' },
        { user_id: 1, post_id: 2, body: 'Lights creepeth may. Fowl itself you\'re. Dry given moved man gathered moved replenish living. Likeness you\'ll to his can\'t every air fruit for, morning under they\'re.' },
        { user_id: 1, post_id: 2, body: 'Perhaps a re-engineering of your current world view will re-energize your online nomenclature to enable a new holistic interactive enterprise internet communication solution.' },
        { user_id: 1, post_id: 2, body: 'Fundamentally transforming well designed actionable information whose semantic content is virtually null.' },
        { user_id: 1, post_id: 3, body: 'Empowerment in information design literacy demands the immediate and complete disregard of the entire contents of this cyberspace communication.' },
        { user_id: 1, post_id: 3, body: 'Doing business like this takes much more effort than doing your own business at home' },
        { user_id: 1, post_id: 3, body: ' The Big Oxmox advised her not to do so, because there were thousands of bad Commas' }
      ]);
    });
};