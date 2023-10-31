// Copyright (c) 2012-2022 John Nesky and contributing authors, distributed under the MIT license, see accompanying the LICENSE.md file.

import { Config } from "../synth/SynthConfig";
import { HTML } from "imperative-html/dist/esm/elements-strict";
import { SongDocument } from "./SongDocument";
import { Prompt } from "./Prompt";
import { ChangeGroup } from "./Change";
import { ChangeBarCount } from "./changes";
import { ColorConfig } from "./ColorConfig";
import { Localization as _ } from "./Localization";

	const {button, div, span, h2, input, br, select, option} = HTML;

export class SongDurationPrompt implements Prompt {
		private readonly _barsStepper: HTMLInputElement = input({style: "width: 3em; margin-left: 1em;", type: "number", step: "1"});
		private readonly _positionSelect: HTMLSelectElement = select({style: "width: 100%;"},
			option({value: "end"}, _.songDurationPrompt1Label),
			option({value: "beginning"}, _.songDurationPrompt2Label),
	);
		private readonly _cancelButton: HTMLButtonElement = button({class: "cancelButton"});
		private readonly _okayButton: HTMLButtonElement = button({class: "okayButton", style: "width:45%;"}, _.confirmLabel);
		
		public readonly container: HTMLDivElement = div({class: "prompt noSelection", style: "width: 250px;"},
		h2(_.songDurationPrompt3Label),
			div({style: "display: flex; flex-direction: row; align-items: center; height: 2em; justify-content: flex-end;"},
				div({style: "display: inline-block; text-align: right;"},
				_.songDurationPrompt4Label,
				br(),
					span({style: `font-size: smaller; color: ${ColorConfig.secondaryText};`}, _.songDurationPrompt5Label),

			),
			this._barsStepper,
		),
			div({style: "display: flex; flex-direction: row; align-items: center; height: 2em; justify-content: flex-end;"},
				div({class: "selectContainer", style: "width: 100%;"}, this._positionSelect),
		),
			div({style: "display: flex; flex-direction: row-reverse; justify-content: space-between;"},
			this._okayButton,
		),
		this._cancelButton,
	);
		
	constructor(private _doc: SongDocument) {

		this._barsStepper.value = this._doc.song.barCount + "";
		this._barsStepper.min = Config.barCountMin + "";
		this._barsStepper.max = Config.barCountMax + "";
			
		const lastPosition: string | null = window.localStorage.getItem("barCountPosition");
		if (lastPosition != null) {
			this._positionSelect.value = lastPosition;
		}
			
		this._barsStepper.select();
			setTimeout(()=>this._barsStepper.focus());
			
		this._okayButton.addEventListener("click", this._saveChanges);
		this._cancelButton.addEventListener("click", this._close);
		this._barsStepper.addEventListener("keypress", SongDurationPrompt._validateKey);
		this._barsStepper.addEventListener("blur", SongDurationPrompt._validateNumber);
		this.container.addEventListener("keydown", this._whenKeyPressed);
	}
		
		private _close = (): void => { 
		this._doc.undo();
	}
		
	public cleanUp = (): void => {
		this._okayButton.removeEventListener("click", this._saveChanges);
		this._cancelButton.removeEventListener("click", this._close);
		this._barsStepper.removeEventListener("keypress", SongDurationPrompt._validateKey);
		this._barsStepper.removeEventListener("blur", SongDurationPrompt._validateNumber);
		this.container.removeEventListener("keydown", this._whenKeyPressed);
	}
		
	private _whenKeyPressed = (event: KeyboardEvent): void => {
			if ((<Element> event.target).tagName != "BUTTON" && event.keyCode == 13) { // Enter key
			this._saveChanges();
		}
	}
		
	private static _validateKey(event: KeyboardEvent): boolean {
		const charCode = (event.which) ? event.which : event.keyCode;
		if (charCode != 46 && charCode > 31 && (charCode < 48 || charCode > 57)) {
			event.preventDefault();
			return true;
		}
		return false;
	}
		
	private static _validateNumber(event: Event): void {
		const input: HTMLInputElement = <HTMLInputElement>event.target;
		input.value = String(SongDurationPrompt._validate(input));
	}
		
	private static _validate(input: HTMLInputElement): number {
		return Math.floor(Math.max(Number(input.min), Math.min(Number(input.max), Number(input.value))));
	}
		
	private _saveChanges = (): void => {
		window.localStorage.setItem("barCountPosition", this._positionSelect.value);
		const group: ChangeGroup = new ChangeGroup();
		group.append(new ChangeBarCount(this._doc, SongDurationPrompt._validate(this._barsStepper), this._positionSelect.value == "beginning"));
		this._doc.prompt = null;
		this._doc.record(group, true);
	}
}
