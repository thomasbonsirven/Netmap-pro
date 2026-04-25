import { Routes, Route } from 'react-router'
import Home from './pages/Home'
import Login from './pages/Login'
import NotFound from './pages/NotFound'
import NetworkMap from './pages/NetworkMap'
import Devices from './pages/Devices'
import DeviceDetail from './pages/DeviceDetail'
import Scan from './pages/Scan'
import Settings from './pages/Settings'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/network-map" element={<NetworkMap />} />
      <Route path="/devices" element={<Devices />} />
      <Route path="/devices/:id" element={<DeviceDetail />} />
      <Route path="/scan" element={<Scan />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
