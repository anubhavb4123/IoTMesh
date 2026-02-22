import { Link } from "react-router-dom";
import "../styles/iotmesh.css";

const IotMesh = () => {
  return (
    <>
      {/* Hero Section */}
      <section className="hero">
        <div className="container hero-content">
          
          <h1>
            IoTMesh — Intelligent Automation Engine  
            for Homes, Industries & Smart Factories
          </h1>

          <p>
            IoTMesh connects embedded systems, cloud infrastructure, and real-time
            analytics into one unified automation ecosystem. Monitor sensors,
            control devices, receive instant alerts, and scale seamlessly —
            from a single smart home to enterprise-grade industrial environments.
          </p>

          <p style={{ marginTop: "20px", opacity: 0.9 }}>
            Secure. Scalable. Real-Time. Built for the future of connected intelligence.
          </p>

          <div style={{ marginTop: "30px" }}>
            <Link to="/auth" className="btn btn-primary">
              Access IoTMesh Platform
            </Link>

            <a href="#contact" className="btn btn-secondary">
              Explore Solutions
            </a>
          </div>

          <div style={{ marginTop: "40px", opacity: 0.7 }}>
            <span>✔ Real-Time Monitoring</span> &nbsp;&nbsp;
            <span>✔ Cloud Integration</span> &nbsp;&nbsp;
            <span>✔ Secure Remote Control</span> &nbsp;&nbsp;
            <span>✔ Industrial-Grade Reliability</span>
          </div>

        </div>
      </section>

      {/* ========= Explore IoTMesh Platform Section======= */}
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

          <p>
            IoTMesh is a next-generation IoT automation platform designed to bridge 
            the gap between embedded hardware systems and modern cloud infrastructure. 
            It transforms traditional devices into intelligent, connected systems capable 
            of real-time monitoring, secure remote control, and dynamic automation.
          </p>

          <p>
            Built on a distributed architecture, IoTMesh connects multiple ESP-based 
            microcontroller nodes, sensors, actuators, and cloud services into a 
            unified ecosystem. Each device communicates securely with the cloud, 
            enabling centralized control, live data visualization, event-driven 
            automation, and multi-user access management.
          </p>

          <p>
            Whether it's a smart home, a commercial building, or an industrial facility, 
            IoTMesh provides the scalability and flexibility required to deploy 
            intelligent automation at any level — from single-room control to 
            factory-scale infrastructure.
          </p>

          <ul className="feature-list">
            <li className="stagger">
              <strong>Embedded Systems Integration</strong> – Seamless connection of ESP32/ESP8266, sensors, relays, and microcontrollers into a unified network.
            </li>

            <li className="stagger">
              <strong>Cloud-Based Intelligence</strong> – Firebase-powered real-time database with secure backend synchronization.
            </li>

            <li className="stagger">
              <strong>Real-Time Data Monitoring</strong> – Live updates for temperature, pressure, gas levels, power state, and device activity.
            </li>

            <li className="stagger">
              <strong>Secure Remote Control</strong> – Role-based access control with encrypted cloud communication.
            </li>

            <li className="stagger">
              <strong>Scalable Architecture</strong> – Multi-node device support enabling expansion from home automation to industrial automation.
            </li>

            <li className="stagger">
              <strong>Event-Driven Automation</strong> – Smart alerts, conditional triggers, and real-time notification system via web and Telegram.
            </li>
          </ul>
        </div>
      </section>

      {/* Home Automation Section */}
      <section id="home-automation">
        <div className="container">
          <h2>Smart Home Automation</h2>

          <p>
            IoTMesh transforms traditional homes into intelligent, responsive environments 
            powered by real-time cloud connectivity and embedded control systems. 
            From lighting automation to environmental safety monitoring, every 
            device becomes part of a unified smart ecosystem.
          </p>

          <p>
            Designed for reliability and scalability, IoTMesh enables seamless 
            interaction between sensors, microcontrollers, and cloud infrastructure — 
            giving users complete control, visibility, and automation capabilities 
            from anywhere in the world.
          </p>

          <div className="grid">

            <div className="card stagger">
              <h3>Advanced Device Control</h3>
              <p>
                Remotely manage lights, fans, televisions, refrigerators, and 
                other appliances through a real-time web dashboard. 
                Instant state synchronization ensures that every action 
                reflects immediately across devices and users.
              </p>
            </div>

            <div className="card stagger">
              <h3>Telegram Command & Alert System</h3>
              <p>
                Receive instant alerts for gas leaks, door status, power changes, 
                and battery levels directly on Telegram. Control devices via 
                secure command-based messaging without opening the dashboard.
              </p>
            </div>

            <div className="card stagger">
              <h3>Environmental Intelligence</h3>
              <p>
                Monitor temperature, humidity, pressure, gas concentration, 
                water levels, and power states in real time. 
                Historical data logging enables analytics and predictive insights.
              </p>
            </div>

            <div className="card stagger">
              <h3>Energy & Power Management</h3>
              <p>
                Track battery voltage, inverter/grid switching, and 
                energy consumption patterns. Optimize power usage 
                through smart alerts and automated switching logic.
              </p>
            </div>

            <div className="card stagger">
              <h3>Multi-Room & Multi-ESP Architecture</h3>
              <p>
                Connect multiple ESP nodes across different rooms. 
                Each node operates independently while synchronizing 
                securely with the central cloud database.
              </p>
            </div>

            <div className="card stagger">
              <h3>Event-Driven Automation</h3>
              <p>
                Configure automated responses such as turning on fans 
                when temperature rises, sending alerts during gas detection, 
                or switching power sources during outages.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ========= Industry & Factory Automation Section ========*/}
      <section id="industry-automation" className="animate-on-scroll">
        <div className="container">
          <h2>Industry & Factory Automation</h2>

          <p>
            IoTMesh extends beyond smart homes to deliver enterprise-level 
            industrial automation solutions. Built for high-demand environments, 
            the platform enables real-time machine monitoring, intelligent power 
            management, predictive insights, and centralized control across 
            large-scale operations.
          </p>

          <p>
            With a cloud-connected distributed ESP architecture, factories can 
            monitor production units, manage energy resources, and respond to 
            environmental risks instantly — ensuring operational continuity, 
            safety compliance, and maximum efficiency.
          </p>

          <div className="grid">

            <div className="card stagger">
              <h3>Industrial Machine Monitoring</h3>
              <p>
                Track machine performance, runtime, load conditions, 
                temperature, vibration indicators, and power usage 
                in real time. Identify anomalies early to reduce 
                downtime and maintenance costs.
              </p>
            </div>

            <div className="card stagger">
              <h3>Smart Grid & Power Management</h3>
              <p>
                Automatically switch between grid power, inverter systems, 
                or backup sources based on real-time availability and load. 
                Prevent outages and optimize energy distribution.
              </p>
            </div>

            <div className="card stagger">
              <h3>Safety & Compliance Monitoring</h3>
              <p>
                Detect hazardous gas levels, overheating systems, 
                unauthorized access, or environmental risks. 
                Instant alerts ensure rapid response and workplace safety.
              </p>
            </div>

            <div className="card stagger">
              <h3>Centralized Control Dashboard</h3>
              <p>
                Manage multiple factory units from a unified cloud dashboard. 
                Access live metrics, control devices remotely, 
                analyze historical trends, and generate operational insights.
              </p>
            </div>

            <div className="card stagger">
              <h3>Multi-Node Distributed Architecture</h3>
              <p>
                Deploy multiple ESP-based controllers across different 
                production zones. Each node operates independently while 
                synchronizing securely with the central database.
              </p>
            </div>

            <div className="card stagger">
              <h3>Predictive Maintenance & Analytics</h3>
              <p>
                Use historical data logging and cloud-based analytics 
                to anticipate equipment failures, optimize workflows, 
                and enhance long-term operational planning.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Platform Capabilities Section */}
      <section id="capabilities">
        <div className="container">
          <h2>Platform Capabilities</h2>

          <p>
            IoTMesh is engineered as a full-stack IoT ecosystem — combining 
            embedded hardware intelligence, cloud computing, secure data flow, 
            and dynamic user interfaces into one unified automation platform.
          </p>

          <p>
            Designed for scalability and flexibility, IoTMesh supports distributed 
            device networks, real-time decision making, and customizable automation 
            logic suitable for homes, industries, and large-scale infrastructures.
          </p>

          <div className="grid">

            <div className="card">
              <h3>Advanced Device Orchestration</h3>
              <p>
                Manage and control multiple ESP-based nodes across different 
                environments with centralized configuration and real-time status updates.
              </p>
            </div>

            <div className="card">
              <h3>Real-Time Telemetry & Monitoring</h3>
              <p>
                Stream live data from sensors including temperature, humidity, 
                pressure, gas levels, voltage, and system health metrics with 
                instant dashboard updates.
              </p>
            </div>

            <div className="card">
              <h3>Event-Driven Alert System</h3>
              <p>
                Configure threshold-based alerts and receive immediate notifications 
                via Telegram or dashboard warnings for safety and operational events.
              </p>
            </div>

            <div className="card">
              <h3>Cloud-Native Architecture</h3>
              <p>
                Powered by Firebase cloud infrastructure for real-time database 
                synchronization, scalable deployment, and high availability.
              </p>
            </div>

            <div className="card">
              <h3>Custom Automation Rules Engine</h3>
              <p>
                Define intelligent workflows such as auto-switching power sources, 
                device scheduling, sensor-triggered actions, and energy optimization logic.
              </p>
            </div>

            <div className="card">
              <h3>Secure & Encrypted Communication</h3>
              <p>
                End-to-end encrypted communication between devices, cloud backend, 
                and frontend interfaces ensuring data privacy and system integrity.
              </p>
            </div>

            <div className="card">
              <h3>Historical Data Logging & Analytics</h3>
              <p>
                Maintain structured historical logs for performance tracking, 
                trend analysis, predictive maintenance, and operational insights.
              </p>
            </div>

            <div className="card">
              <h3>Global Remote Access</h3>
              <p>
                Securely access and manage your IoT ecosystem from anywhere 
                using a responsive web dashboard with real-time synchronization.
              </p>
            </div>

            <div className="card">
              <h3>Multi-User Role-Based Access</h3>
              <p>
                Support for guest and admin roles with permission-based control 
                systems, enabling secure collaborative management.
              </p>
            </div>

            <div className="card">
              <h3>Modular & Expandable System Design</h3>
              <p>
                Easily add new devices, sensors, automation rules, and control nodes 
                without disrupting existing infrastructure.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Portfolio / Screenshots Section */}
      <section id="portfolio">
        <div className="container">
          <h2>IoTMesh Platform Preview</h2>

          <p>
            Experience the powerful and intuitive interface of IoTMesh — designed 
            to deliver clarity, control, and real-time insights across your entire 
            IoT infrastructure.
          </p>

          <p>
            Each module of the platform is built with performance, usability, 
            and scalability in mind — enabling seamless interaction between 
            embedded devices and cloud intelligence.
          </p>

          <div className="portfolio-grid">

            <div className="portfolio-item stagger">
              <img 
                src="/pictures/dashboard.png" 
                alt="IoTMesh Dashboard Overview" 
              />
              <h3>Centralized Dashboard</h3>
              <p>
                A real-time overview of all connected ESP nodes, system health, 
                environmental metrics, device states, and alert notifications 
                in one unified control panel.
              </p>
            </div>

            <div className="portfolio-item stagger">
              <img 
                src="/pictures/sensors.png" 
                alt="Sensor Monitoring Interface" 
              />
              <h3>Live Sensor Monitoring</h3>
              <p>
                Monitor temperature, humidity, gas levels, pressure, voltage, 
                battery percentage, and power source status with dynamic updates 
                synchronized directly from embedded systems.
              </p>
            </div>

            <div className="portfolio-item stagger">
              <img 
                src="/pictures/devices1.png" 
                alt="Device Management Interface" 
              />
              <h3>Device Management & Control</h3>
              <p>
                Remotely control relays, lighting systems, fans, appliances, 
                and industrial switches through a secure cloud-synced interface.
              </p>
            </div>

            <div className="portfolio-item stagger">
              <img 
                src="/pictures/devices2.png" 
                alt="Advanced Device Configuration" 
              />
              <h3>Advanced Device Configuration</h3>
              <p>
                Configure device behavior, assign ESP pins, customize controls, 
                and manage room-wise automation dynamically for each user profile.
              </p>
            </div>

            <div className="portfolio-item stagger">
              <img 
                src="/pictures/alerts.png" 
                alt="Alert System Interface" 
              />
              <h3>Smart Alert System</h3>
              <p>
                Instant alert notifications for gas leaks, power switching, 
                door status changes, and battery thresholds — ensuring 
                proactive safety management.
              </p>
            </div>

            <div className="portfolio-item stagger">
              <img 
                src="/pictures/telegram.png" 
                alt="Telegram Integration" 
              />
              <h3>Telegram Bot Integration</h3>
              <p>
                Control devices and receive real-time alerts directly via Telegram, 
                enabling secure command-based automation from anywhere.
              </p>
            </div>

            <div className="portfolio-item stagger">
              <img 
                src="/pictures/users.png" 
                alt="User Management Interface" 
              />
              <h3>Role-Based User Management</h3>
              <p>
                Manage multiple users with guest and admin permissions, 
                ensuring secure access control across different IoT environments.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section id="vision">
        <div className="container">
          <h2>The IoTMesh Vision</h2>

          <p>
            IoTMesh is not just an automation platform — it is a unified 
            intelligence layer designed to connect embedded systems, cloud 
            computing, and real-world infrastructure into one scalable ecosystem.
          </p>

          <p>
            Our mission is to build a secure, intelligent, and adaptive IoT 
            framework capable of powering everything from smart homes to 
            large-scale industrial environments — while maintaining simplicity, 
            performance, and user control.
          </p>

          <div className="grid">

            <div className="card stagger">
              <h3>Intelligent Automation</h3>
              <p>
                Systems that go beyond simple ON/OFF control — IoTMesh is built 
                to support rule-based automation, adaptive behaviors, and 
                context-aware decision making powered by real-time data.
              </p>
            </div>

            <div className="card stagger">
              <h3>AI-Driven Insights</h3>
              <p>
                Transform raw sensor data into actionable intelligence using 
                analytics, predictive monitoring, and machine learning models 
                for performance optimization and preventive maintenance.
              </p>
            </div>

            <div className="card stagger">
              <h3>Scalable IoT Mesh Architecture</h3>
              <p>
                From a single ESP device in a room to a distributed multi-node 
                industrial network, IoTMesh is designed to scale seamlessly 
                without compromising stability or performance.
              </p>
            </div>

            <div className="card stagger">
              <h3>Universal Integration Layer</h3>
              <p>
                Designed to integrate with diverse microcontrollers, sensors, 
                APIs, messaging platforms like Telegram, and cloud services — 
                creating a unified, interoperable automation ecosystem.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ========== Final CTA Section ======== */}
      <section
        id="contact"
        style={{
          background:
            "linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-primary) 100%)",
        }}
      >
        <div className="container" style={{ textAlign: "center" }}>
          
          <h2>Ready to Build Intelligent Systems?</h2>

          <p>
            Whether you're automating a smart home, developing an IoT startup,
            or deploying industrial-grade monitoring systems — IoTMesh provides
            the infrastructure, scalability, and intelligence you need.
          </p>

          <p style={{ maxWidth: "750px", margin: "20px auto", opacity: 0.9 }}>
            Experience secure device control, real-time analytics, cloud
            synchronization, and scalable automation architecture — all within
            one unified platform.
          </p>

          <div style={{ marginTop: "30px" }}>
            <Link to="/auth" className="btn btn-primary">
              Access IoTMesh Platform
            </Link>

            <a
              href="https://anubhavb-tech-hub.web.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
            >
              Meet the Founder
            </a>

            <a
              href="mailto:iotmesh4123@gmail.com"
              className="btn btn-secondary"
            >
              Contact Us
            </a>
          </div>

          <div style={{ marginTop: "40px", opacity: 0.7, fontSize: "0.9rem" }}>
            <p>
              IoTMesh © {new Date().getFullYear()} — Engineered for Intelligent Automation.
            </p>
          </div>

        </div>
      </section>
    </>
  );
};

export default IotMesh;
