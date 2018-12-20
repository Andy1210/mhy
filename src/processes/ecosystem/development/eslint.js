import path from 'path'
import Process from '@/processes'

const getEslintCLICmd = args => {
    const {
        flags,
        argv: { pattern = [] }
    } = args

    // It's a file/path, use that
    if (!pattern.length) {
        pattern.push(
            `"${path.resolve(process.cwd(), 'src/**/*.{js,jsx,ts,tsx}')}"`
        )
    }
    return [
        'node',
        require.resolve('eslint/bin/eslint.js'),
        `--config=${require.resolve('@/configs/prettier')}`,
        '--write',
        ...flags,
        ...pattern
    ]
}

class Prettier extends Process {
    static isDefault = false

    get commandToUse() {
        return process.env.MHY_ENV === 'ui'
            ? getPrettierServeCLICmd
            : getPrettierCLICmd
    }

    constructor(args) {
        const { props: { defaultAction = 'start' } = {}, ...rest } = args
        super(args)
        this.run(defaultAction, { ...rest })
    }

    onStart = ({ name }, args) => this.spawn(name, this.commandToUse(args))

    onRestart = async () => {
        await this.kill('start')
        this.run('start')
    }

    // Feature test only
    processLine(d) {
        if (d.startsWith('change:')) {
            this.emit('action', 'clear')
        }
        return d
            .replace('PASS', '{green-bg} PASS {/green-bg}')
            .replace('FAIL', '{red-bg} FAIL {/red-bg}')
    }

    actions = [
        {
            name: 'start',
            enabled: true,
            onRun: this.onStart
        },
        {
            name: 'restart',
            label: 'Restart',
            shortcut: 'r',
            enabled: true,
            onRun: this.onRestart
        }
    ]
}

export default () => Prettier
