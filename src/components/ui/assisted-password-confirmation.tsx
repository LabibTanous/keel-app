"use client"

import { motion } from "framer-motion"
import { useEffect, useState } from "react"

export function AssistedPasswordConfirmation({ password }: { password: string }) {
  const [confirmPassword, setConfirmPassword] = useState("")
  const [shake, setShake] = useState(false)

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (
      confirmPassword.length >= password.length &&
      e.target.value.length > confirmPassword.length
    ) {
      setShake(true)
    } else {
      setConfirmPassword(e.target.value)
    }
  }

  useEffect(() => {
    if (shake) {
      const timer = setTimeout(() => setShake(false), 500)
      return () => clearTimeout(timer)
    }
  }, [shake])

  const getLetterStatus = (letter: string, index: number) => {
    if (!confirmPassword[index]) return ""
    return confirmPassword[index] === letter ? "bg-green-500/20" : "bg-red-500/20"
  }

  const passwordsMatch = password.length > 0 && password === confirmPassword

  const bounceAnimation = {
    x: shake ? [-10, 10, -10, 10, 0] : 0,
    transition: { duration: 0.5 },
  }

  const matchAnimation = {
    scale: passwordsMatch ? [1, 1.05, 1] : 1,
    transition: { duration: 0.3 },
  }

  const borderAnimation = {
    borderColor: passwordsMatch ? "#10B981" : "",
    transition: { duration: 0.3 },
  }

  if (!password) return null

  return (
    <div className="flex w-full flex-col gap-2">
      {/* Ghost password visualiser */}
      <motion.div
        className="h-[48px] w-full rounded-xl border-2 border-slate-200 bg-white px-2 py-2"
        animate={{ ...bounceAnimation, ...matchAnimation, ...borderAnimation }}
      >
        <div className="relative h-full w-fit overflow-hidden rounded-lg">
          {/* Dot row */}
          <div className="z-10 flex h-full items-center justify-center bg-transparent px-0 py-1 tracking-[0.15em]">
            {password.split("").map((_, index) => (
              <div key={index} className="flex h-full w-4 shrink-0 items-center justify-center">
                <span className="size-[5px] rounded-full bg-slate-800" />
              </div>
            ))}
          </div>
          {/* Colour overlay per character */}
          <div className="absolute bottom-0 left-0 top-0 z-0 flex h-full w-full items-center justify-start">
            {password.split("").map((letter, index) => (
              <motion.div
                key={index}
                className={`ease absolute h-full w-4 transition-all duration-300 ${getLetterStatus(letter, index)}`}
                style={{
                  left: `${index * 16}px`,
                  scaleX: confirmPassword[index] ? 1 : 0,
                  transformOrigin: "left",
                }}
              />
            ))}
          </div>
        </div>
      </motion.div>

      {/* Confirm input */}
      <motion.div className="h-[48px] w-full overflow-hidden rounded-xl" animate={matchAnimation}>
        <motion.input
          className="h-full w-full rounded-xl border-2 border-slate-200 bg-white px-3.5 py-3 tracking-[0.4em] text-slate-900 outline-none placeholder:tracking-normal focus:border-slate-900"
          type="password"
          placeholder="Confirm password"
          value={confirmPassword}
          onChange={handleConfirmPasswordChange}
          animate={borderAnimation}
        />
      </motion.div>

      {passwordsMatch && (
        <p className="text-xs font-semibold text-emerald-600">Passwords match ✓</p>
      )}
      {confirmPassword.length > 0 && !passwordsMatch && (
        <p className="text-xs text-slate-400">Keep typing…</p>
      )}
    </div>
  )
}
