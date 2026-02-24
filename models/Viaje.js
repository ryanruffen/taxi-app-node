const mongoose = require('mongoose');

const ViajeSchema = new mongoose.Schema({
    pasajero: { type: String, default: "Ryan Ruffen" },
    destino: String,
    fecha: { type: Date, default: Date.now },
    estado: { type: String, default: 'pendiente' }
});

module.exports = mongoose.model('Viaje', ViajeSchema);