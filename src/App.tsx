import { useMemo, useState } from 'react'
import type { CodeLanguage, PresetData } from './types'
import { Header } from './components/Header'
import { DataInput } from './components/DataInput'
import { CodeDebugger } from './components/CodeDebugger'
import { Canvas } from './components/Canvas'
import { ControlPanel } from './components/ControlPanel'
import { FloatingBall } from './components/FloatingBall'
import { useAlgorithmPlayer } from './hooks/useAlgorithmPlayer'
import { generateSteps } from './algorithms/stepGenerator'
import styles from './App.module.css'

const TOPIC_TITLE = 'HBase 数据模型'
const TOPIC_NUMBER = 3
const TOPIC_CATEGORY = '数据模型'
const REPO_NAME = 'hbase-03-data-model'
const REPO_URL = `https://github.com/CC11001100/${REPO_NAME}`

const PRESETS: PresetData[] = [
  { label: '默认场景', data: {} },
  { label: '多列族', data: {} },
  { label: '多列限定符', data: {} },
]

export default function App() {
  const [selectedLanguage, setSelectedLanguage] = useState<CodeLanguage>('java')
  const [presetIndex, setPresetIndex] = useState(0)

  const steps = useMemo(() => generateSteps(), [presetIndex])

  const [playerState, playerActions] = useAlgorithmPlayer(steps)

  const currentStep = steps[playerState.currentStepIndex] ?? steps[0]

  return (
    <div className={styles.app}>
      <Header
        title={TOPIC_TITLE}
        topicNumber={TOPIC_NUMBER}
        category={TOPIC_CATEGORY}
        repoUrl={REPO_URL}
      />

      <DataInput
        presets={PRESETS}
        onSelect={(preset) => setPresetIndex(PRESETS.indexOf(preset))}
      />

      <main className={styles.main}>
        <div className={styles.leftPanel}>
          <Canvas step={currentStep} />
          <ControlPanel
            currentStep={playerState.currentStepIndex}
            totalSteps={playerState.totalSteps}
            isPlaying={playerState.isPlaying}
            playbackRate={playerState.playbackRate}
            onPrev={playerActions.prev}
            onNext={playerActions.next}
            onPlay={playerActions.play}
            onPause={playerActions.pause}
            onReset={playerActions.reset}
            onSeek={playerActions.seek}
            onPlaybackRateChange={playerActions.setPlaybackRate}
          />
        </div>
        <div className={styles.rightPanel}>
          <CodeDebugger
            language={selectedLanguage}
            onLanguageChange={setSelectedLanguage}
            currentLine={currentStep.currentLine}
            variables={currentStep.variables}
          />
        </div>
      </main>

      <FloatingBall />
    </div>
  )
}