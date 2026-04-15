// 실행 취소/다시 실행을 위한 히스토리 관리
class UndoRedo {
    constructor() {
        this.states = [''];
        this.currentIndex = 0;
        this.maxHistorySize = 50;
    }

    // 상태 추가
    addState(text) {
        // 현재 인덱스 이후의 상태들은 제거 (새로운 분기 생성)
        this.states = this.states.slice(0, this.currentIndex + 1);

        // 새로운 상태 추가
        this.states.push(text);

        // 최대 크기 제한
        if (this.states.length > this.maxHistorySize) {
            this.states.shift();
        } else {
            this.currentIndex++;
        }
    }

    // 실행 취소
    undo() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            return this.states[this.currentIndex];
        }

        return null;
    }

    // 다시 실행
    redo() {
        if (this.currentIndex < this.states.length - 1) {
            this.currentIndex++;
            return this.states[this.currentIndex];
        }

        return null;
    }

    // 실행 취소 가능 여부
    canUndo() {
        return this.currentIndex > 0;
    }

    // 다시 실행 가능 여부
    canRedo() {
        return this.currentIndex < this.states.length - 1;
    }
}

window.UndoRedo = UndoRedo;
window.textHistory = new UndoRedo();
