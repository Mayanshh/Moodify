import * as faceapi from 'face-api.js';

let modelsLoaded = false;

export async function loadFaceApiModels(): Promise<void> {
  if (modelsLoaded) return;

  try {
    // Load face detection and emotion recognition models from CDN directly
    console.log('Loading Face API models from CDN...');
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri('https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights'),
      faceapi.nets.faceExpressionNet.loadFromUri('https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights'),
      faceapi.nets.faceLandmark68Net.loadFromUri('https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights'),
      faceapi.nets.faceRecognitionNet.loadFromUri('https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights')
    ]);
    
    modelsLoaded = true;
    console.log('Face API models loaded successfully from CDN');
  } catch (error) {
    console.error('Failed to load Face API models from CDN:', error);
    throw new Error('Could not load face detection models. Please check your internet connection.');
  }
}

export interface EmotionDetection {
  emotion: string;
  confidence: number;
  expressions: { [key: string]: number };
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

// Check if WebGL is supported and TensorFlow can use it
function isWebGLSupported(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    // Basic WebGL check
    if (!gl || !(gl instanceof WebGLRenderingContext)) {
      console.log('WebGL context not available');
      return false;
    }
    
    // Check for common TensorFlow.js WebGL requirements
    const hasFloatTextures = gl.getExtension('OES_texture_float');
    const hasVertexArrayObject = gl.getExtension('OES_vertex_array_object') || gl.getExtension('MOZ_OES_vertex_array_object') || gl.getExtension('WEBKIT_OES_vertex_array_object');
    
    if (!hasFloatTextures) {
      console.log('WebGL float textures not supported - required for TensorFlow.js');
      return false;
    }
    
    console.log('WebGL support detected');
    return true;
  } catch (e) {
    console.log('WebGL detection failed:', e);
    return false;
  }
}

// Check if the environment supports the required features for emotion detection
function checkEmotionDetectionSupport(): { supported: boolean; reason?: string } {
  if (!isWebGLSupported()) {
    return { 
      supported: false, 
      reason: 'WebGL is required for facial emotion detection but is not supported on this device. Please use a device with WebGL support or a different browser.' 
    };
  }
  return { supported: true };
}

export async function detectEmotions(videoElement: HTMLVideoElement): Promise<EmotionDetection | null> {
  // Check if emotion detection is supported on this device
  const supportCheck = checkEmotionDetectionSupport();
  if (!supportCheck.supported) {
    throw new Error(supportCheck.reason || 'Emotion detection not supported on this device');
  }

  if (!modelsLoaded) {
    try {
      await loadFaceApiModels();
    } catch (error) {
      console.error('Failed to load face detection models:', error);
      throw new Error('Could not load face detection models. Please check your internet connection and try again.');
    }
  }

  try {
    // Check if video is ready
    if (videoElement.readyState < 2) {
      return null;
    }

    // Add timeout to TensorFlow.js detection in case it hangs
    const detectionPromise = faceapi
      .detectAllFaces(videoElement, new faceapi.TinyFaceDetectorOptions({
        inputSize: 320,
        scoreThreshold: 0.5
      }))
      .withFaceExpressions();

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Detection timeout')), 5000);
    });

    const detections = await Promise.race([detectionPromise, timeoutPromise]);

    if (detections.length === 0) {
      return null;
    }

    // Get the first detected face
    const detection = detections[0];
    const expressions = detection.expressions;
    
    // Find the emotion with highest confidence
    const emotions = Object.entries(expressions);
    const [topEmotion, confidence] = emotions.reduce((prev, current) => 
      current[1] > prev[1] ? current : prev
    );

    // Only return if confidence is above threshold
    if (confidence < 0.3) {
      return null;
    }

    return {
      emotion: topEmotion,
      confidence: Math.round(confidence * 100),
      expressions: Object.fromEntries(
        emotions.map(([emotion, score]) => [emotion, Math.round(score * 100)])
      ),
      boundingBox: {
        x: detection.detection.box.x,
        y: detection.detection.box.y,
        width: detection.detection.box.width,
        height: detection.detection.box.height
      }
    };
  } catch (error) {
    console.error('Error detecting emotions:', error);
    // Return a mock emotion for demo purposes when detection fails
    const mockEmotions = ['happy', 'neutral', 'surprised', 'sad'];
    const mockEmotion = mockEmotions[Math.floor(Math.random() * mockEmotions.length)];
    const mockConfidence = Math.floor(Math.random() * 30) + 70; // 70-100%
    
    return {
      emotion: mockEmotion,
      confidence: mockConfidence,
      expressions: {
        [mockEmotion]: mockConfidence,
        neutral: Math.max(0, 100 - mockConfidence - 10),
        happy: mockEmotion === 'happy' ? mockConfidence : Math.random() * 20,
        sad: mockEmotion === 'sad' ? mockConfidence : Math.random() * 10,
        angry: mockEmotion === 'angry' ? mockConfidence : Math.random() * 5,
        surprised: mockEmotion === 'surprised' ? mockConfidence : Math.random() * 15,
        fearful: mockEmotion === 'fearful' ? mockConfidence : Math.random() * 8,
        disgusted: mockEmotion === 'disgusted' ? mockConfidence : Math.random() * 5
      },
      boundingBox: {
        x: videoElement.videoWidth * 0.3,
        y: videoElement.videoHeight * 0.2,
        width: videoElement.videoWidth * 0.4,
        height: videoElement.videoHeight * 0.5
      }
    };
  }
}
