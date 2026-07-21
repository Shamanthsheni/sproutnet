import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Strike from '@tiptap/extension-strike'
import Highlight from '@tiptap/extension-highlight'
import Color from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import CharacterCount from '@tiptap/extension-character-count'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import TextAlign from '@tiptap/extension-text-align'
import Superscript from '@tiptap/extension-superscript'
import Subscript from '@tiptap/extension-subscript'
import Placeholder from '@tiptap/extension-placeholder'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { createLowlight } from 'lowlight'

// Register common languages for syntax highlighting
import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import python from 'highlight.js/lib/languages/python'
import css from 'highlight.js/lib/languages/css'
import html from 'highlight.js/lib/languages/xml'
import sql from 'highlight.js/lib/languages/sql'
import bash from 'highlight.js/lib/languages/bash'
import json from 'highlight.js/lib/languages/json'

const lowlight = createLowlight()
lowlight.register('javascript', javascript)
lowlight.register('js', javascript)
lowlight.register('typescript', typescript)
lowlight.register('ts', typescript)
lowlight.register('python', python)
lowlight.register('py', python)
lowlight.register('css', css)
lowlight.register('html', html)
lowlight.register('sql', sql)
lowlight.register('bash', bash)
lowlight.register('sh', bash)
lowlight.register('json', json)

export const WORD_ESTIMATE_WPM = 200

export function buildExtensions(placeholder = 'Start writing your story...') {
  return [
    StarterKit.configure({
      strike: false,        // overridden below for cleaner config
      codeBlock: false,     // replaced by lowlight-enhanced version
      heading: {
        levels: [1, 2, 3],
      },
    }),
    Strike,
    Underline,
    Highlight.configure({ multicolor: false }),
    TextStyle,
    Color,
    CharacterCount,
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        rel: 'noopener noreferrer nofollow',
        target: '_blank',
        class: 'sn-editor-link',
      },
    }),
    Image.configure({
      HTMLAttributes: {
        class: 'sn-editor-image',
        loading: 'lazy',
      },
    }),
    TaskList,
    TaskItem.configure({ nested: true }),
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    Superscript,
    Subscript,
    CodeBlockLowlight.configure({ lowlight }),
    Placeholder.configure({ placeholder }),
  ]
}
