const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
const PORT = 3001;

// EOSDA API configuration
const EOSDA_API_KEY = 'apk.95a092bdfdf721c1f721e3a611048643f3fe8c0071bd1a8e6529ea72f885f4fd';
const EOSDA_BASE_URL = 'https://api-connect.eos.com';

app.use(cors());
app.use(express.json());

// Test endpoint to verify proxy is running
app.get('/test', (req, res) => {
    res.json({ message: 'EOSDA Proxy is running!', timestamp: new Date().toISOString() });
});

// Endpoint to fetch weather forecast data from EOSDA
app.post('/fetch-weather', async (req, res) => {
    try {
        // Use Yandina Farm polygon as default geometry
        const geometry = req.body.geometry || {
            "type": "Polygon",
            "coordinates": [[
                [152.9148355104133, -26.49630785386763],
                [152.9149951437186, -26.49644491790693],
                [152.9150826047683, -26.49643498282219],
                [152.915136003929, -26.49647654096426],
                [152.9151679717066, -26.49641027369633],
                [152.9151522879532, -26.4963066956674],
                [152.9151405649811, -26.49617943071427],
                [152.9151330645278, -26.49603918146022],
                [152.9150405267262, -26.49598117140157],
                [152.9149028386955, -26.49619458038391],
                [152.9148355104133, -26.49630785386763]
            ]]
        };
        const date_from = req.body.date_from || "2024-06-16T00:00";
        const date_to = req.body.date_to || "2024-06-18T00:00";

        const apiUrl = `${EOSDA_BASE_URL}/api/forecast/weather/forecast/?api_key=${EOSDA_API_KEY}`;
        const payload = {
            geometry,
            date_from,
            date_to
        };
        console.log('Making request to EOSDA Weather API:', apiUrl);
        console.log('Payload:', payload);

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const text = await response.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error('EOSDA Weather API returned non-JSON:', text);
            return res.status(500).json({
                error: 'EOSDA Weather API returned non-JSON',
                raw: text
            });
        }

        if (!response.ok) {
            console.error('EOSDA Weather API error:', response.status, data);
            return res.status(response.status).json({
                error: 'EOSDA Weather API error',
                status: response.status,
                details: data
            });
        }

        console.log('EOSDA Weather API response received:', data);
        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error.message
        });
    }
});

// Endpoint to fetch historical weather data from EOSDA
app.post('/fetch-historical-weather', async (req, res) => {
    try {
        // Use Yandina Farm polygon as default geometry
        const geometry = req.body.geometry || {
            "type": "Polygon",
            "coordinates": [[
                [152.9148355104133, -26.49630785386763],
                [152.9149951437186, -26.49644491790693],
                [152.9150826047683, -26.49643498282219],
                [152.915136003929, -26.49647654096426],
                [152.9151679717066, -26.49641027369633],
                [152.9151522879532, -26.4963066956674],
                [152.9151405649811, -26.49617943071427],
                [152.9151330645278, -26.49603918146022],
                [152.9150405267262, -26.49598117140157],
                [152.9149028386955, -26.49619458038391],
                [152.9148355104133, -26.49630785386763]
            ]]
        };
        const date_from = req.body.date_from || "2024-06-10T00:00";
        const date_to = req.body.date_to || "2024-06-17T00:00";

        const apiUrl = `${EOSDA_BASE_URL}/api/forecast/weather/historical/?api_key=${EOSDA_API_KEY}`;
        const payload = {
            geometry,
            date_from,
            date_to
        };
        console.log('Making request to EOSDA Historical Weather API:', apiUrl);
        console.log('Payload:', payload);

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const text = await response.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error('EOSDA Historical Weather API returned non-JSON:', text);
            return res.status(500).json({
                error: 'EOSDA Historical Weather API returned non-JSON',
                raw: text
            });
        }

        if (!response.ok) {
            console.error('EOSDA Historical Weather API error:', response.status, data);
            return res.status(response.status).json({
                error: 'EOSDA Historical Weather API error',
                status: response.status,
                details: data
            });
        }

        console.log('EOSDA Historical Weather API response received:', data);
        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error.message
        });
    }
});

// Endpoint to fetch vegetation indices statistics from EOSDA
app.post('/fetch-vegetation-indices', async (req, res) => {
    try {
        const geometry = req.body.geometry || {
            "type": "Polygon",
            "coordinates": [[
                [152.9148355104133, -26.49630785386763],
                [152.9149951437186, -26.49644491790693],
                [152.9150826047683, -26.49643498282219],
                [152.915136003929, -26.49647654096426],
                [152.9151679717066, -26.49641027369633],
                [152.9151522879532, -26.4963066956674],
                [152.9151405649811, -26.49617943071427],
                [152.9151330645278, -26.49603918146022],
                [152.9150405267262, -26.49598117140157],
                [152.9149028386955, -26.49619458038391],
                [152.9148355104133, -26.49630785386763]
            ]]
        };
        const date_start = req.body.date_start;
        const date_end = req.body.date_end;
        const bm_type = req.body.bm_type || ["NDVI", "EVI", "SAVI", "MSI"];
        const sensors = req.body.sensors || ["sentinel2"];
        const apiUrl = `${EOSDA_BASE_URL}/api/gdw/api?api_key=${EOSDA_API_KEY}`;
        const payload = {
            type: "mt_stats",
            params: {
                bm_type,
                date_start,
                date_end,
                geometry,
                sensors
            }
        };
        // Step 1: Create task
        const createResp = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const createData = await createResp.json();
        if (!createResp.ok || !createData.task_id) {
            return res.status(500).json({ error: 'Failed to create EOSDA statistics task', details: createData });
        }
        const task_id = createData.task_id;
        // Step 2: Poll for result
        const resultUrl = `${EOSDA_BASE_URL}/api/gdw/api/${task_id}?api_key=${EOSDA_API_KEY}`;
        let resultData = null;
        let attempts = 0;
        while (attempts < 20) { // up to ~20 seconds
            const resultResp = await fetch(resultUrl, { method: 'GET' });
            const resultJson = await resultResp.json();
            if (resultJson.result && Array.isArray(resultJson.result) && resultJson.result.length > 0) {
                resultData = resultJson.result;
                break;
            }
            if (resultJson.errors && resultJson.errors.length > 0) {
                return res.status(500).json({ error: 'EOSDA statistics task error', details: resultJson.errors });
            }
            await new Promise(r => setTimeout(r, 1000));
            attempts++;
        }
        if (!resultData) {
            return res.status(504).json({ error: 'Timed out waiting for EOSDA statistics result' });
        }
        // Format result: for each date, return index values
        const formatted = resultData.map(scene => {
            const out = { date: scene.date };
            for (const idx of bm_type) {
                if (scene.indexes && scene.indexes[idx]) {
                    out[idx.toLowerCase()] = scene.indexes[idx].average;
                }
            }
            return out;
        });
        res.json({ success: true, data: formatted });
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

// Endpoint to fetch soil moisture statistics from EOSDA
app.post('/fetch-soil-moisture', async (req, res) => {
    try {
        const geometry = req.body.geometry || {
            "type": "Polygon",
            "coordinates": [[
                [29.659867, 49.596693],
                [29.658108, 49.591491],
                [29.667463, 49.590072],
                [29.669137, 49.595135],
                [29.659867, 49.596693]
            ]]
        };
        const date_start = req.body.date_start;
        const date_end = req.body.date_end;
        const bm_type = req.body.bm_type || "soilmoisture";
        const sensors = req.body.sensors || ["soilmoisture"];
        const limit = req.body.limit || 10;
        const apiUrl = `${EOSDA_BASE_URL}/api/gdw/api?api_key=${EOSDA_API_KEY}`;
        const payload = {
            type: "mt_stats",
            params: {
                bm_type,
                date_start,
                date_end,
                geometry,
                sensors,
                limit
            }
        };
        // Step 1: Create task
        const createResp = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const createData = await createResp.json();
        if (!createResp.ok || !createData.task_id) {
            return res.status(500).json({ error: 'Failed to create EOSDA soil moisture task', details: createData });
        }
        const task_id = createData.task_id;
        // Step 2: Poll for result
        const resultUrl = `${EOSDA_BASE_URL}/api/gdw/api/${task_id}?api_key=${EOSDA_API_KEY}`;
        let resultData = null;
        let attempts = 0;
        while (attempts < 20) { // up to ~20 seconds
            const resultResp = await fetch(resultUrl, { method: 'GET' });
            const resultJson = await resultResp.json();
            if (resultJson.result && Array.isArray(resultJson.result) && resultJson.result.length > 0) {
                resultData = resultJson.result;
                break;
            }
            if (resultJson.errors && resultJson.errors.length > 0) {
                return res.status(500).json({ error: 'EOSDA soil moisture task error', details: resultJson.errors });
            }
            await new Promise(r => setTimeout(r, 1000));
            attempts++;
        }
        if (!resultData) {
            return res.status(504).json({ error: 'Timed out waiting for EOSDA soil moisture result' });
        }
        res.json({ success: true, data: resultData });
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`EOSDA Proxy server running on http://localhost:${PORT}`);
    console.log('Available endpoints:');
    console.log('  GET  /test - Test if proxy is running');
    console.log('  POST /fetch-weather - Fetch weather forecast data');
    console.log('  POST /fetch-historical-weather - Fetch historical weather data');
    console.log('  POST /fetch-vegetation-indices - Fetch vegetation indices statistics');
    console.log('  POST /fetch-soil-moisture - Fetch soil moisture statistics');
});