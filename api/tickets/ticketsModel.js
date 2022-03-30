const db = require('../../data/db-config');

function getPendingTickets() {
  return db('tickets as t')
    .select('t.*', 'ty.ticket_type')
    .join('ticket_types as ty', 't.ticket_type', 'ty.ticket_type_id')
    .orderBy('ticket_id');
}
module.exports = {
  getPendingTickets,
};