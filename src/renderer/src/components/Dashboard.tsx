import { useEffect, useState } from 'react'

const Dashboard = () => {
  const [fileCount, setFileCount] = useState(0)
  const [partCount, setPartCount] = useState(0)

  useEffect(() => {
    const fetchStats = async () => {
      setFileCount(await window.context.fetchFileCount())
      setPartCount(await window.context.fetchPartCount())
    }

    fetchStats()
  }, [])

  return (
    <>
      <h2>Dashboard</h2>
      {fileCount > 0 ? (
        <p>Files Found: {fileCount}</p>
      ) : (
        <p>No files fount, did you set the correct directory?</p>
      )}
      {partCount > 0 && <p>Parts fount: {partCount}</p>}
    </>
  )
}

export default Dashboard
