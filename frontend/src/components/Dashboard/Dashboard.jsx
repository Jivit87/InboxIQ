import React from 'react'

const Dashboard = ({user, onLogout}) => {

  const handleLogout = () => {
    onLogout();
  }
  return (
    <button onClick={handleLogout}> Logout </button>
  )
}

export default Dashboard