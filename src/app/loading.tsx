export default function Loading() {
  return (
    <div className="page" aria-busy="true" aria-label="Chargement">
      <div
        style={{
          width: 100,
          height: 10,
          background: "#d9d6d0",
          marginBottom: 30,
        }}
      />
      <div
        style={{
          width: "65%",
          height: 64,
          background: "#e7e3dd",
          marginBottom: 30,
        }}
      />
      <div style={{ width: "100%", height: 300, background: "#eeeae4" }} />
    </div>
  );
}
