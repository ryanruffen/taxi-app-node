require('dotenv').config();

const express = require('express');
const { Client } = require("@googlemaps/google-maps-services-js");
const mongoose = require('mongoose');
const Viaje = require('./models/Viaje');
const path = require('path');
const rutasPasajeros = require('./routes/pasajeros');
const rutasConductores = require('./routes/conductores');

const app = express();
const client = new Client({});

// Configuración de base de datos
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/taxi-app')
.then(() => console.log('✅ Base de datos conectada'))
.catch(err => console.error('❌ Error de conexión:', err));

// Middlewares
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Rutas de archivos externos (Opcional si las usas)
app.use('/pasajeros', rutasPasajeros);
app.use('/conductores', rutasConductores);

// --- RUTAS DE LA API ---

// 1. Autocompletado de Google Maps
app.get('/api/autocomplete', async (req, res) => {
    try {
        const response = await client.placeAutocomplete({
            params: {
                input: req.query.input,
                key: process.env.GOOGLE_MAPS_API_KEY,
                language: 'es',
            },
        });
        res.json(response.data.predictions);
    } catch (e) {
        console.error(e);
        res.status(500).send(e.message);
    }
});

// 2. Guardar pedido de taxi
app.post('/api/viajes', async (req, res) => {
    try {
        const nuevoViaje = new Viaje({
            destino: req.body.destino,
            pasajero: "Ryan Ruffen" 
        });
        await nuevoViaje.save();
        res.status(201).json({ mensaje: 'Viaje guardado con éxito', viaje: nuevoViaje });
    } catch (error) {
        res.status(500).json({ error: 'No se pudo guardar el viaje' });
    }
});

// 3. Ver viajes pendientes (Para el conductor)
app.get('/api/viajes/pendientes', async (req, res) => {
    try {
        const viajes = await Viaje.find().sort({ fecha: -1 });
        res.json(viajes);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener viajes' });
    }
});

// 4. Aceptar un viaje (Cambia el estado)
app.post('/api/viajes/aceptar/:id', async (req, res) => {
    try {
        const viajeActualizado = await Viaje.findByIdAndUpdate(
            req.params.id, 
            { estado: 'en camino' }, 
            { new: true }
        );
        res.json({ mensaje: 'Viaje aceptado', viaje: viajeActualizado });
    } catch (error) {
        res.status(500).json({ error: 'No se pudo aceptar el viaje' });
    }
});

// 5. Ruta segura para el Mapa (Para no exponer tu API KEY en el HTML)
app.get('/api/viaje/mapa/:destino', (req, res) => {
    const destino = encodeURIComponent(req.params.destino);
    // Nota: Usamos una URL de embed estándar o estática
    const mapaUrl = `https://www.google.com/maps/embed/v1/place?key=${process.env.GOOGLE_MAPS_API_KEY}&q=${destino}`;
    res.json({ url: mapaUrl });
});

// --- ENCENDIDO DEL SERVIDOR ---
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`✅ Servidor de MI-TAXI-APP corriendo en http://localhost:${PORT}`);
});