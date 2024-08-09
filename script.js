let serverAddress = '';
let lastSent = 0;
let maxRate = 1000 / 10; // Initial rate: 10 messages per second

let calibration = { alpha: 0, beta: 0, gamma: 0 };
let calibrated = false;

let ws;

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

function formatKeyValuePairs(alpha, beta, gamma, accelX, accelY, accelZ) {
    const pairs = [
        `kv=1:${alpha}`,
        `kv=2:${beta}`,
        `kv=3:${gamma}`,
        `kv=4:${accelX}`,
        `kv=5:${accelY}`,
        `kv=6:${accelZ}`
    ];
    return pairs.join('&');
}

function sendData(alpha, beta, gamma, accelX, accelY, accelZ) {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        document.getElementById('error').textContent = 'WebSocket connection is not open.';
        return;
    }

    const message = formatKeyValuePairs(alpha, beta, gamma, accelX, accelY, accelZ);

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

        sendData(adjustedAlpha, adjustedBeta, adjustedGamma, currentAccelX, currentAccelY, currentAccelZ);
    }
}

function handleMotionData(event) {
    currentAccelX = event.acceleration.x ? event.acceleration.x.toFixed(2) : 0;
    currentAccelY = event.acceleration.y ? event.acceleration.y.toFixed(2) : 0;
    currentAccelZ = event.acceleration.z ? event.acceleration.z.toFixed(2) : 0;

    document.getElementById('accelData').textContent = `Accel X: ${currentAccelX} | Accel Y: ${currentAccelY} | Accel Z: ${currentAccelZ}`;
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
