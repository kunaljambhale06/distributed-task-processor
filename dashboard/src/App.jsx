import { useEffect, useState } from "react";
import API from "./api";

function App() {
  const [jobs, setJobs] = useState([]);
  const [stats, setStats] = useState({});
  const [queue, setQueue] = useState({});

  const fetchData = async () => {
    const jobsRes = await API.get("/jobs");
    const statsRes = await API.get("/jobs/stats");
    const queueRes = await API.get("/jobs/queue-stats");

    setJobs(jobsRes.data);
    setStats(statsRes.data);
    setQueue(queueRes.data);
  };

  useEffect(() => {
    fetchData();

    const i = setInterval(fetchData, 2000);
    return () => clearInterval(i);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-6">

      <h1 className="text-3xl font-bold mb-6">
        Job Dashboard
      </h1>

      {/* Stats Cards */}

      <div className="grid grid-cols-4 gap-4 mb-6">

        <div className="bg-white p-4 rounded shadow">
          Total: {stats.total}
        </div>

        <div className="bg-yellow-200 p-4 rounded shadow">
          Pending: {stats.pending}
        </div>

        <div className="bg-green-200 p-4 rounded shadow">
          Completed: {stats.completed}
        </div>

        <div className="bg-red-200 p-4 rounded shadow">
          Failed: {stats.failed}
        </div>

      </div>

      {/* Queue */}

      <div className="mb-6">

        <div className="bg-white p-4 rounded shadow">
          Job Queue: {queue.jobQueue}
        </div>

        <div className="bg-white p-4 rounded shadow mt-2">
          Failed Queue: {queue.failed_jobs}
        </div>

      </div>

      {/* Jobs */}

      <div className="space-y-3">

        {jobs.map((job) => (
          <div
            key={job._id}
            className="bg-white p-4 rounded shadow flex justify-between"
          >

            <div>
              <p className="font-semibold">
                {job.name}
              </p>

              <p>
                retries: {job.retries}
              </p>
            </div>

            <span className="px-3 py-1 rounded bg-gray-200">
              {job.status}
            </span>

          </div>
        ))}

      </div>

    </div>
  );
}

export default App;