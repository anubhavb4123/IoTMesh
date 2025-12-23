export default function BackgroundVideo() {
  return (
    <>
      {/* 🎥 Background Video */}
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        className="fixed inset-0 w-full h-full object-cover -z-50"
      >
        <source src="/bg-video.mp4" type="video/mp4" />
      </video>

      {/* 🌑 Dark overlay for readability */}
      <div className="fixed inset-0 bg-black/70 -z-40" />
    </>
  );
}