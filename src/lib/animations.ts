// Animation variants for FloatingNavbar component

export const containerVariants = {
  expanded: {
    width: 520,
    height: 46,
    paddingLeft: 14,
    paddingRight: 5,
    paddingTop: 0,
    paddingBottom: 0,
    borderRadius: 23,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 500,
      damping: 35,
      mass: 0.5
    }
  },
  minimized: {
    width: 46,
    height: 46,
    padding: 0,
    borderRadius: 23,
    scale: 0.98,
    transition: {
      type: "spring" as const,
      stiffness: 500,
      damping: 35,
      mass: 0.5
    }
  }
}

export const letterVariants = {
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      delay: 0.05,
      type: "spring" as const,
      stiffness: 600,
      damping: 30
    }
  },
  hidden: {
    opacity: 0,
    scale: 0.3,
    transition: {
      type: "spring" as const,
      stiffness: 600,
      damping: 30
    }
  }
}

export const contentVariants = {
  visible: {
    opacity: 1,
    scale: 1,
    x: 0,
    transition: {
      delay: 0.06,
      type: "spring" as const,
      stiffness: 500,
      damping: 35
    }
  },
  hidden: {
    opacity: 0,
    scale: 0.92,
    x: -8,
    transition: {
      type: "spring" as const,
      stiffness: 500,
      damping: 35
    }
  }
}

export const statusBarVariants = {
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 500,
      damping: 35
    }
  },
  hidden: {
    opacity: 0,
    y: -10,
    transition: {
      type: "spring" as const,
      stiffness: 500,
      damping: 35
    }
  }
}

