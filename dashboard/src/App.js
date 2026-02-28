import { useEffect, useState } from "react";

function App() {
  const [jobs, setJobs] = useState([]);

  const fetchJobs = async () => {
    const res = await fetch("http://localhost:5000/jobs");
    const data = await res.json();
    setJobs(data);
  };

  useEffect(() => {
    fetchJobs();

    const interval = setInterval(fetchJobs, 2000); 
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ padding: 40 }}>
      <h1>Job Dashboard </h1>

      {jobs.map((job) => (
        <div
          key={job._id}
          style={{
            padding: 15,
            margin: "10px 0",
            border: "1px solid #ddd",
            borderRadius: 8,
          }}
        >
          <strong>{job.name}</strong>

          <span
            style={{
              marginLeft: 10,
              padding: "5px 10px",
              borderRadius: 5,
              backgroundColor:
                job.status === "completed"
                  ? "#d4edda"
                  : job.status === "failed"
                  ? "#f8d7da"
                  : job.status === "processing"
                  ? "#fff3cd"
                  : "#e2e3e5",
            }}
          >
            {job.status}
          </span>

          <span style={{ marginLeft: 10 }}>
            Retries: {job.retries}
          </span>
        </div>
      ))}
    </div>
  );
}

export default App;