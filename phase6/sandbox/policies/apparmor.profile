# AppArmor profile for Sovereign LMS Python execution sandbox
# Restricts filesystem modifications, network access, and capability elevation.

#include <tunables/global>

profile lms-sandbox flags=(attach_disconnected,mediate_deleted) {
  #include <abstractions/base>

  # Deny all network access
  deny network,

  # Deny raw device and kernel capability elevation
  deny capability setuid,
  deny capability setgid,
  deny capability sys_admin,
  deny capability sys_rawio,
  deny capability sys_ptrace,

  # Deny sensitive system filesystem reads
  deny /etc/shadow* r,
  deny /etc/passwd* r,
  deny /etc/sudoers* r,
  deny /root/** rwklx,
  deny /sys/** rwklx,
  deny /proc/sys/** rwklx,

  # Allow read access to Python stdlib & runner
  /usr/local/lib/python3.11/** r,
  /usr/lib/python3.11/** r,
  /runner.py r,

  # Allow read/write only within ephemeral tmpfs /tmp
  /tmp/** rw,

  # Deny binary execution within /tmp (noexec)
  deny /tmp/** x,
}
