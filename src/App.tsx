import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select"
import { Icon } from "@iconify/react"
import { type Themes, useThemeStore } from "./lib/store/useThemeStore"
import ChatInput from "@/components/atoms/chat-input"


function App() {
  const theme = useThemeStore(state => state.theme)
  const setTheme = useThemeStore(state => state.setTheme)

  const getThemeIcon = (themeValue: Themes) => {
    switch (themeValue) {
      case "dark":
        return "material-symbols-light:dark-mode-rounded"
      case "light":
        return "ix:light-dark"
      case "system":
        return "mingcute:laptop-line"
    }
  }

  const getThemeLabel = (themeValue: Themes) => {
    switch (themeValue) {
      case "dark":
        return "Dark mode"
      case "light":
        return "Light mode"
      case "system":
        return "System"
    }
  }

  return (
    <main className="w-full min-h-screen bg-background p-4">
      <Select value={theme} onValueChange={(value: string) => setTheme(value as Themes)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue>
            <div className="flex items-center gap-2">
              <Icon icon={getThemeIcon(theme)} />
              <span>{getThemeLabel(theme)}</span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="dark">
            <Icon icon="material-symbols-light:dark-mode-rounded" />
            <span>Dark mode</span>
          </SelectItem>
          <SelectItem value="light">
            <Icon icon="ix:light-dark" />
            <span>Light mode</span>
          </SelectItem>
          <SelectItem value="system">
            <Icon icon="mingcute:laptop-line" />
            <span>System</span>
          </SelectItem>
        </SelectContent>
      </Select>

      <ChatInput />
    </main>
  )
}

export default App
