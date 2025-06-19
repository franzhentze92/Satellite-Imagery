const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = 3001;

// EOSDA API configuration
const EOSDA_API_KEY = 'apk.95a092bdfdf721c1f721e3a611048643f3fe8c0071bd1a8e6529ea72f885f4fd';
const EOSDA_BASE_URL = 'https://api-connect.eos.com';

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Test endpoint to verify proxy is running
app.get('/test', (req, res) => {
    res.json({ message: 'EOSDA Proxy is running!', timestamp: new Date().toISOString() });
});

// Helper function to wait for task completion
async function pollTaskStatus(taskId) {
    let attempts = 0;
    const maxAttempts = 15;
    const initialDelay = 5000; // 5 seconds initial delay
    const pollInterval = 4000; // 4 seconds between attempts

    // Initial delay to let the task initialize
    console.log(`Waiting ${initialDelay/1000} seconds for task to initialize...`);
    await new Promise(resolve => setTimeout(resolve, initialDelay));

    while (attempts < maxAttempts) {
        attempts++;
        console.log(`Attempt ${attempts}: Polling for task status...`);

        try {
            const response = await axios({
                method: 'get',
                url: `${EOSDA_BASE_URL}/api/gdw/api/${taskId}`,
                params: {
                    api_key: EOSDA_API_KEY
                }
            });

            console.log('Task response status:', response.status);
            console.log('Task response data:', JSON.stringify(response.data, null, 2));

            // Check for error message first
            if (response.data.error_message) {
                throw new Error(JSON.stringify(response.data.error_message));
            }

            // Check for result data
            if (response.data.result) {
                return response.data.result;
            }

            // If no result yet, check status
            const taskStatus = response.data.status?.toLowerCase();
            console.log('Task status:', taskStatus);

            if (taskStatus === 'finished' || taskStatus === 'done') {
                return response.data.data || response.data.result;
            } else if (taskStatus === 'failed' || taskStatus === 'error') {
                throw new Error(`Task failed: ${JSON.stringify(response.data)}`);
            } else if (taskStatus === 'created' || taskStatus === 'pending' || taskStatus === 'running') {
                console.log(`Task still ${taskStatus}, waiting ${pollInterval/1000} seconds...`);
                await new Promise(resolve => setTimeout(resolve, pollInterval));
                continue;
            } else {
                throw new Error(`Unknown task status: ${taskStatus}`);
            }

        } catch (error) {
            console.error('Error polling task status:', error.message);
            
            if (error.response?.status === 429) {
                console.log('Rate limit reached, waiting 30 seconds...');
                await new Promise(resolve => setTimeout(resolve, 30000));
                continue;
            }
            
            if (error.response?.status >= 500) {
                console.log(`Server error (${error.response.status}), retrying in ${pollInterval/1000} seconds...`);
                await new Promise(resolve => setTimeout(resolve, pollInterval));
                continue;
            }
            
            throw error;
        }
    }

    throw new Error('Task timed out after maximum attempts');
}

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

// Endpoint to proxy EOSDA Search API for Sentinel-2 scenes
app.post('/fetch-scenes', async (req, res) => {
    try {
        const apiUrl = `${EOSDA_BASE_URL}/api/lms/search/v2/sentinel2`;
        const response = await axios({
            method: 'post',
            url: apiUrl,
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': EOSDA_API_KEY
            },
            data: req.body
        });
        res.json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json({
            error: true,
            message: error.message,
            details: error.response?.data
        });
    }
});

// Endpoint to fetch vegetation indices statistics from EOSDA
app.post('/fetch-vegetation-indices', async (req, res) => {
    try {
        const { bm_type, date_start, date_end, geometry, sensors, limit } = req.body;

        // Get default dates (last 30 days)
        const now = new Date();
        const defaultEndDate = new Date(now.setDate(now.getDate() - 1)); // Yesterday
        const defaultStartDate = new Date(now.setDate(now.getDate() - 30)); // 30 days before yesterday

        const startDate = date_start || defaultStartDate.toISOString().split('T')[0];
        const endDate = date_end || defaultEndDate.toISOString().split('T')[0];

        console.log('Step 1: Searching for Sentinel-2 scenes...');
        
        // Step 1: Search for scenes using the Search API
        const searchPayload = {
            fields: ["sceneID", "cloudCoverage", "date", "view_id"],
            limit: limit || 10,
            page: 1,
            search: {
                date: { from: startDate, to: endDate },
                cloudCoverage: { from: 0, to: 90 }, // Allow up to 90% cloud coverage
                shape: geometry
            },
            sort: { date: "desc" }
        };

        console.log('Search payload:', JSON.stringify(searchPayload, null, 2));

        const searchResponse = await axios({
            method: 'post',
            url: `${EOSDA_BASE_URL}/api/lms/search/v2/sentinel2`,
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': EOSDA_API_KEY
            },
            data: searchPayload
        });

        if (searchResponse.status !== 200) {
            throw new Error(`Search API error: ${searchResponse.status} ${JSON.stringify(searchResponse.data)}`);
        }

        const scenes = searchResponse.data.results;
        console.log(`Found ${scenes.length} scenes`);

        if (scenes.length === 0) {
            return res.json({
                success: true,
                error: false,
                data: [],
                message: 'No scenes found for the specified parameters'
            });
        }

        // Step 2: Get statistics for each scene sequentially
        const validResults = [];
        for (const scene of scenes) {
            let statsPayload = {
                type: 'mt_stats',
                params: {
                    bm_type: Array.isArray(bm_type) ? bm_type : ['ndvi'],  // Default to NDVI if not specified
                    date_start: scene.date.split('T')[0],  // Use scene's date
                    date_end: scene.date.split('T')[0],    // Same as start date for single scene
                    geometry: geometry,
                    reference: `${scene.sceneID}_${Date.now()}`,  // Unique reference
                    sensors: ['sentinel2'],
                    max_cloud_cover_in_aoi: 90,
                    exclude_cover_pixels: true,
                    cloud_masking_level: 2  // Medium + high probability clouds
                }
            };

            console.log('Statistics payload:', JSON.stringify(statsPayload, null, 2));

            let statsResponse;
            let attempts = 0;
            while (attempts < 5) {
                attempts++;
                try {
                    statsResponse = await axios({
                        method: 'post',
                        url: `${EOSDA_BASE_URL}/api/gdw/api`,
                        params: {
                            api_key: EOSDA_API_KEY
                        },
                        data: statsPayload,
                        validateStatus: function (status) {
                            return status === 200 || status === 202 || status === 429;
                        }
                    });

                    if (statsResponse.status === 429) {
                        console.log('Rate limit reached (429), waiting 30 seconds before retrying...');
                        await new Promise(resolve => setTimeout(resolve, 30000));
                        continue;
                    }

                    if (statsResponse.status === 202 && statsResponse.data.task_id) {
                        // Task created, poll for completion
                        const taskId = statsResponse.data.task_id;
                        console.log(`Task created for scene ${scene.sceneID} with ID: ${taskId}`);
                        try {
                            const result = await pollTaskStatus(taskId);
                            validResults.push({
                                scene_id: scene.sceneID,
                                view_id: scene.view_id,
                                date: scene.date,
                                cloud: scene.cloudCoverage,
                                statistics: result
                            });
                        } catch (pollError) {
                            console.error(`Polling failed for scene ${scene.sceneID}:`, pollError.message);
                        }
                        break;
                    }

                    if (statsResponse.status === 200) {
                        // Synchronous result (rare)
                        validResults.push({
                            scene_id: scene.sceneID,
                            view_id: scene.view_id,
                            date: scene.date,
                            cloud: scene.cloudCoverage,
                            statistics: statsResponse.data
                        });
                        break;
                    }

                } catch (error) {
                    console.error(`Error processing scene ${scene.sceneID}:`, error.message);
                    if (attempts === 5) {
                        console.error(`Giving up on scene ${scene.sceneID} after 5 attempts.`);
                    }
                }
            }
        }

        console.log(`Successfully processed ${validResults.length} out of ${scenes.length} scenes`);

        res.json({
            success: true,
            error: false,
            data: validResults
        });

    } catch (error) {
        console.error('Error in /fetch-vegetation-indices:', error.message);
        res.status(error.response?.status || 500).json({
            success: false,
            error: true,
            message: error.message,
            details: error.response?.data
        });
    }
});

// Endpoint to fetch soil moisture statistics from EOSDA
app.post('/fetch-soil-moisture', async (req, res) => {
    try {
        const { date_start, date_end, geometry, limit } = req.body;
        
        // Use Yandina Farm polygon as default geometry if not provided
        const defaultGeometry = {
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

        const requestGeometry = geometry || defaultGeometry;
        const requestLimit = limit || 10;
        
        // Validate required parameters
        if (!date_start || !date_end) {
            return res.status(400).json({ 
                error: 'date_start and date_end are required parameters' 
            });
        }

        console.log('Making soil moisture request with parameters:');
        console.log('Date range:', date_start, 'to', date_end);
        console.log('Geometry:', JSON.stringify(requestGeometry, null, 2));

        const payload = {
            type: "mt_stats",
            params: {
                bm_type: "soilmoisture",
                date_start: date_start,
                date_end: date_end,
                geometry: requestGeometry,
                reference: `soilmoisture_${Date.now()}`,
                sensors: ["soilmoisture"],
                limit: requestLimit
            }
        };

        console.log('Soil moisture payload:', JSON.stringify(payload, null, 2));

        // Step 1: Create task
        const createResponse = await axios({
            method: 'POST',
            url: `${EOSDA_BASE_URL}/api/gdw/api`,
            params: {
                api_key: EOSDA_API_KEY
            },
            data: payload,
            headers: { 'Content-Type': 'application/json' }
        });

        console.log('Create task response status:', createResponse.status);
        console.log('Create task response data:', JSON.stringify(createResponse.data, null, 2));

        if (createResponse.status !== 202 || !createResponse.data.task_id) {
            return res.status(500).json({ 
                error: 'Failed to create EOSDA soil moisture task', 
                details: createResponse.data 
            });
        }

        const taskId = createResponse.data.task_id;
        console.log(`Soil moisture task created with ID: ${taskId}`);

        // Step 2: Poll for result using the existing pollTaskStatus function
        try {
            const result = await pollTaskStatus(taskId);
            console.log('Soil moisture result received:', JSON.stringify(result, null, 2));
            
            res.json({ 
                success: true, 
                data: result 
            });
        } catch (pollError) {
            console.error('Error polling soil moisture task:', pollError.message);
            res.status(500).json({ 
                error: 'Failed to get soil moisture result', 
                details: pollError.message 
            });
        }

    } catch (error) {
        console.error('Error in /fetch-soil-moisture:', error.message);
        res.status(error.response?.status || 500).json({ 
            error: 'Internal server error', 
            details: error.message 
        });
    }
});

app.listen(PORT, () => {
    console.log(`EOSDA Proxy server running on http://localhost:${PORT}`);
    console.log('Available endpoints:');
    console.log('  GET  /test - Test if proxy is running');
    console.log('  POST /fetch-weather - Fetch weather forecast data');
    console.log('  POST /fetch-historical-weather - Fetch historical weather data');
    console.log('  POST /fetch-scenes - Proxy EOSDA Search API for Sentinel-2 scenes');
    console.log('  POST /fetch-vegetation-indices - Fetch vegetation indices statistics');
    console.log('  POST /fetch-soil-moisture - Fetch soil moisture statistics');
});