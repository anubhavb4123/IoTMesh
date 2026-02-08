import { Link } from "react-router-dom";
import "../styles/iotmesh.css";

const IotMesh = () => {
  return (
    <>
      {/* Hero Section */}
      <section className="hero">
        <div className="container hero-content">
          <h1>IoTMesh – Smart Automation for Homes, Industry & Factories</h1>
          <p>IoTMesh is a smart automation ecosystem designed for homes, industries, and factories using real-time data, cloud intelligence, and secure communication.</p>
          <Link to="/auth" className="btn btn-primary">Login to IoTMesh</Link>
          <a href="#contact" className="btn btn-secondary">Contact IoTMesh</a>
        </div>
      </section>

      {/* Explore IoTMesh Platform Section */}
      <section id="explore">
        <div className="container">
          <h2>Explore IoTMesh Platform</h2>
          <p>Discover the core features of IoTMesh through our intuitive platform interfaces.</p>
          <div className="showcase-container">
            <div className="showcase-row">
              <div className="showcase-text">
                <h3>Central Dashboard</h3>
                <p>Comprehensive overview of all connected devices and system status. Monitor real-time metrics and control operations from a unified interface.</p>
              </div>
              <div className="showcase-image">
                <img src="/pictures/dashboard.png" alt="Central Dashboard" />
              </div>
            </div>

            <div className="showcase-row">
              <div className="showcase-image">
                <div className="showcase-images">
                  <img src="/pictures/devices1.png" alt="Device Management" />
                  <img src="/pictures/devices2.png" alt="Device Control" />
                </div>
              </div>
              <div className="showcase-text">
                <h3>Device Management & Control</h3>
                <p>Efficiently manage and control all IoT devices across your network. Configure settings, monitor performance, and execute commands remotely.</p>
              </div>
            </div>

            <div className="showcase-row">
              <div className="showcase-text">
                <h3>Live Sensor Monitoring</h3>
                <p>Real-time visualization of sensor data including temperature, humidity, and environmental parameters. Track trends and receive instant updates.</p>
              </div>
              <div className="showcase-image">
                <img src="/pictures/sensors.png" alt="Live Sensor Monitoring" />
              </div>
            </div>

            <div className="showcase-row">
              <div className="showcase-image">
                <img src="/pictures/telegram.png" alt="Telegram Bot Automation" />
              </div>
              <div className="showcase-text">
                <h3>Telegram Bot Automation & Alerts</h3>
                <p>Integrate with Telegram for automated notifications and remote control. Receive alerts and manage devices directly through messaging.</p>
              </div>
            </div>

            <div className="showcase-row">
              <div className="showcase-text">
                <h3>Smart Alerts & Notifications</h3>
                <p>Intelligent alert system for critical events and threshold breaches. Customize notification preferences and response protocols.</p>
              </div>
              <div className="showcase-image">
                <img src="/pictures/alerts.png" alt="Smart Alerts & Notifications" />
              </div>
            </div>

            <div className="showcase-row">
              <div className="showcase-image">
                <img src="/pictures/users.png" alt="User & Role Management" />
              </div>
              <div className="showcase-text">
                <h3>User & Role Management</h3>
                <p>Manage user accounts, permissions, and access levels. Ensure secure and organized control over your IoT ecosystem.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About IoTMesh Section */}
      <section id="about">
        <div className="container">
          <h2>About IoTMesh</h2>
          <p>IoTMesh is a cutting-edge IoT platform that seamlessly integrates embedded systems with cloud technology, enabling real-time monitoring, secure remote control, and scalable automation solutions. Our ecosystem empowers users to build intelligent systems that adapt to their needs, from smart homes to industrial operations.</p>
          <ul className="feature-list">
            <li className="stagger">Embedded Systems Integration</li>
            <li className="stagger">Cloud-Based Intelligence</li>
            <li className="stagger">Real-Time Data Monitoring</li>
            <li className="stagger">Secure Remote Control</li>
            <li className="stagger">Scalable Architecture</li>
          </ul>
        </div>
      </section>

      {/* Home Automation Section */}
      <section id="home-automation">
        <div className="container">
          <h2>Smart Home Automation</h2>
          <p>Transform your living space with IoTMesh's comprehensive home automation features, providing convenience, security, and energy efficiency at your fingertips.</p>
          <div className="grid">
            <div className="card stagger">
              <h3>Device Control</h3>
              <p>Remote control of lights, fans, and appliances via intuitive interfaces.</p>
            </div>
            <div className="card stagger">
              <h3>Telegram Integration</h3>
              <p>Receive alerts and control devices directly through Telegram messaging.</p>
            </div>
            <div className="card stagger">
              <h3>Environmental Monitoring</h3>
              <p>Track gas levels, temperature, humidity, and power consumption in real-time.</p>
            </div>
            <div className="card stagger">
              <h3>Energy Management</h3>
              <p>Monitor battery levels and optimize energy usage for sustainable living.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ========= Industry & Factory Automation Section ========*/}
      <section id="industry-automation" className="animate-on-scroll">
        <div className="container">
          <h2>Industry & Factory Automation</h2>
          <p>IoTMesh delivers robust automation solutions for industrial environments, ensuring reliability, safety, and operational efficiency in demanding settings.</p>
          <div className="grid">
            <div className="card stagger">
              <h3>Machine Monitoring</h3>
              <p>Real-time tracking of machine performance and power consumption.</p>
            </div>
            <div className="card stagger">
              <h3>Grid Management</h3>
              <p>Intelligent switching between power sources for uninterrupted operations.</p>
            </div>
            <div className="card stagger">
              <h3>Safety Alerts</h3>
              <p>Environmental safety monitoring with instant alert systems.</p>
            </div>
            <div className="card stagger">
              <h3>Centralized Dashboard</h3>
              <p>Comprehensive monitoring and control from a single, user-friendly interface.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Capabilities Section */}
      <section id="capabilities">
        <div className="container">
          <h2>Platform Capabilities</h2>
          <p>Discover the powerful features that make IoTMesh the ultimate IoT automation platform.</p>
          <div className="grid">
            <div className="card">
              <h3>Device Control</h3>
              <p>Seamless management of connected devices across multiple protocols.</p>
            </div>
            <div className="card">
              <h3>Real-time Monitoring</h3>
              <p>Live data visualization and instant insights into system performance.</p>
            </div>
            <div className="card">
              <h3>Instant Alerts</h3>
              <p>Proactive notifications for critical events and threshold breaches.</p>
            </div>
            <div className="card">
              <h3>Cloud Integration</h3>
              <p>Secure data storage and processing in the cloud for scalability.</p>
            </div>
            <div className="card">
              <h3>Automation Logic</h3>
              <p>Customizable rules and workflows for intelligent system behavior.</p>
            </div>
            <div className="card">
              <h3>Secure Communication</h3>
              <p>End-to-end encryption ensuring data privacy and system integrity.</p>
            </div>
            <div className="card">
              <h3>Historical Analytics</h3>
              <p>Comprehensive data analysis for trend identification and optimization.</p>
            </div>
            <div className="card">
              <h3>Remote Access</h3>
              <p>Access your systems from anywhere with secure remote connectivity.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Portfolio / Screenshots Section */}
      <section id="portfolio">
        <div className="container">
          <h2>IoTMesh Platform Preview</h2>
          <p>Explore the intuitive interfaces that power IoTMesh automation systems.</p>
          <div className="portfolio-grid">
            <div className="portfolio-item stagger">
              <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='200' viewBox='0 0 400 200'%3E%3Crect width='400' height='200' fill='%231a1a2e'/%3E%3Ctext x='200' y='100' text-anchor='middle' fill='%2300d4ff' font-family='Arial' font-size='24'%3EDashboard UI%3C/text%3E%3C/svg%3E" alt="Dashboard UI" />
              <h3>Dashboard UI</h3>
            </div>
            <div className="portfolio-item stagger">
              <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='200' viewBox='0 0 400 200'%3E%3Crect width='400' height='200' fill='%231a1a2e'/%3E%3Ctext x='200' y='100' text-anchor='middle' fill='%2300d4ff' font-family='Arial' font-size='24'%3ESensor Monitoring%3C/text%3E%3C/svg%3E" alt="Sensor Monitoring" />
              <h3>Sensor Monitoring Page</h3>
            </div>
            <div className="portfolio-item stagger">
              <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='200' viewBox='0 0 400 200'%3E%3Crect width='400' height='200' fill='%231a1a2e'/%3E%3Ctext x='200' y='100' text-anchor='middle' fill='%2300d4ff' font-family='Arial' font-size='24'%3EDevice Control%3C/text%3E%3C/svg%3E" alt="Device Control" />
              <h3>Device Control Page</h3>
            </div>
            <div className="portfolio-item stagger">
              <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='200' viewBox='0 0 400 200'%3E%3Crect width='400' height='200' fill='%231a1a2e'/%3E%3Ctext x='200' y='100' text-anchor='middle' fill='%2300d4ff' font-family='Arial' font-size='24'%3EHistory & Analytics%3C/text%3E%3C/svg%3E" alt="History & Analytics" />
              <h3>History & Analytics Page</h3>
            </div>
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section id="vision">
        <div className="container">
          <h2>The IoTMesh Vision</h2>
          <p>IoTMesh is pioneering the future of IoT automation, bridging the gap between physical devices and intelligent systems. Our vision encompasses intelligent automation, AI-driven insights, scalable IoT mesh networks, and seamless integration from single homes to factory-level operations.</p>
          <div className="grid">
            <div className="card stagger">
              <h3>Intelligent Automation</h3>
              <p>AI-powered systems that learn and adapt to user behaviors and environmental conditions.</p>
            </div>
            <div className="card stagger">
              <h3>AI-Driven Insights</h3>
              <p>Advanced analytics providing actionable intelligence for optimized performance.</p>
            </div>
            <div className="card stagger">
              <h3>Scalable IoT Mesh</h3>
              <p>Expandable networks that grow with your needs, from home to enterprise scale.</p>
            </div>
            <div className="card stagger">
              <h3>Universal Integration</h3>
              <p>Seamless connectivity across diverse devices and platforms for unified control.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section id="contact" style={{ background: "linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-primary) 100%)" }}>
        <div className="container" style={{ textAlign: "center" }}>
          <h2>Build smarter systems with IoTMesh</h2>
          <p>Join the revolution in IoT automation and unlock the potential of connected intelligence.</p>
          <Link to="/auth" className="btn btn-primary">Login to IoTMesh</Link>
          <a href="mailto:contact@iotmesh.com" className="btn btn-secondary">Get in Touch</a>
        </div>
      </section>
    </>
  );
};

export default IotMesh;
