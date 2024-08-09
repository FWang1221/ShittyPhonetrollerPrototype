let serverAddress = '';
let lastSent = 0;
let maxRate = 1000 / 10; // Initial rate: 10 messages per second

let calibration = { alpha: 0, beta: 0, gamma: 0 };
let calibrated = false;

let ws;

let velocity = { x: 0, y: 0, z: 0 }; // Velocity values
let lastAcceleration = { x: 0, y: 0, z: 0 };
let lastTime = 0;

document.getElementById('submitAddress').addEventListener('click', function() {
    serverAddress = document.getElementById('serverAddress').value.trim();
    if (!serverAddress) {
        document.getElementById('error').textContent = 'Please enter a valid server address.';
        return;
    }

    if (ws) {
        ws.close();
    }

    ws = new WebSocket(serverAddress);

    ws.onopen = function() {
        document.getElementById('error').textContent = '';
        console.log('WebSocket connection established:', serverAddress);
    };

    ws.onmessage = function(event) {
        console.log('Server response:', event.data);
        document.getElementById('error').textContent = ''; // Clear any previous error messages
    };

    ws.onclose = function(event) {
        console.log('WebSocket connection closed', event);
        document.getElementById('error').textContent = 'WebSocket connection closed.';
    };

    ws.onerror = function(event) {
        console.log('WebSocket error occurred', event);
        document.getElementById('error').textContent = 'WebSocket error occurred.';
    };
});

document.getElementById('rateSlider').addEventListener('input', function() {
    const rate = this.value;
    document.getElementById('rateValue').textContent = rate;
    maxRate = 1000 / rate; // Calculate the interval based on the rate
});

document.getElementById('calibrateButton').addEventListener('click', function() {
    calibration.alpha = currentAlpha;
    calibration.beta = currentBeta;
    calibration.gamma = currentGamma;
    calibrated = true;

    document.getElementById('calibrationOffset').textContent = `Alpha: ${calibration.alpha} | Beta: ${calibration.beta} | Gamma: ${calibration.gamma}`;
    console.log('Calibration set:', calibration);
});

document.getElementById('sendMessageButton').addEventListener('click', function() {
    const customMessage = document.getElementById('customMessage').value.trim();
    if (!customMessage) {
        document.getElementById('error').textContent = 'Please enter a message to send.';
        return;
    }

    if (!ws || ws.readyState !== WebSocket.OPEN) {
        document.getElementById('error').textContent = 'WebSocket connection is not open.';
        return;
    }

    ws.send(customMessage);
    console.log('Sent custom message:', customMessage);
});

let currentAlpha = 0, currentBeta = 0, currentGamma = 0;
let currentAccelX = 0, currentAccelY = 0, currentAccelZ = 0;

function formatKeyValuePairs(alpha, beta, gamma, velX, velY, velZ) {
    const pairs = [
        `kv=1:${alpha}`,
        `kv=2:${beta}`,
        `kv=3:${gamma}`,
        `kv=4:${velX}`,
        `kv=5:${velY}`,
        `kv=6:${velZ}`
    ];
    return pairs.join('&');
}

function sendData(alpha, beta, gamma, velX, velY, velZ) {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        document.getElementById('error').textContent = 'WebSocket connection is not open.';
        return;
    }

    const message = formatKeyValuePairs(alpha, beta, gamma, velX, velY, velZ);

    ws.send(message);
}

function handleOrientationData(event) {
    const currentTime = Date.now();
    if (currentTime - lastSent >= maxRate) {
        lastSent = currentTime;

        currentAlpha = event.alpha ? event.alpha.toFixed(2) : 0;
        currentBeta = event.beta ? event.beta.toFixed(2) : 0;
        currentGamma = event.gamma ? event.gamma.toFixed(2) : 0;

        let adjustedAlpha = currentAlpha;
        let adjustedBeta = currentBeta;
        let adjustedGamma = currentGamma;

        if (calibrated) {
            adjustedAlpha = (currentAlpha - calibration.alpha).toFixed(2);
            adjustedBeta = (currentBeta - calibration.beta).toFixed(2);
            adjustedGamma = (currentGamma - calibration.gamma).toFixed(2);
        }

        document.getElementById('data').textContent = `Alpha: ${adjustedAlpha} | Beta: ${adjustedBeta} | Gamma: ${adjustedGamma}`;

        sendData(adjustedAlpha, adjustedBeta, adjustedGamma, velocity.x, velocity.y, velocity.z);
    }
}

function handleMotionData(event) {
    const currentTime = Date.now();
    const deltaTime = (currentTime - lastTime) / 1000; // Time in seconds since the last event

    if (lastTime !== 0) {
        // Calculate velocity based on acceleration and time interval
        velocity.x += (event.acceleration.x ? event.acceleration.x : 0) * deltaTime;
        velocity.y += (event.acceleration.y ? event.acceleration.y : 0) * deltaTime;
        velocity.z += (event.acceleration.z ? event.acceleration.z : 0) * deltaTime;
    }

    lastTime = currentTime;

    document.getElementById('accelData').textContent = `Velocity X: ${velocity.x.toFixed(2)} | Velocity Y: ${velocity.y.toFixed(2)} | Velocity Z: ${velocity.z.toFixed(2)}`;
}

if (window.DeviceOrientationEvent) {
    window.addEventListener('deviceorientation', handleOrientationData, false);
} else {
    document.getElementById('error').textContent = 'DeviceOrientationEvent is not supported';
}

if (window.DeviceMotionEvent) {
    window.addEventListener('devicemotion', handleMotionData, false);
} else {
    document.getElementById('error').textContent = 'DeviceMotionEvent is not supported';
}
