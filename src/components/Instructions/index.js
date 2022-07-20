import './index.scss'

export const Instructions = ({title, subText}) => {
    return <div className={'instruction'}>
        <p>{title}</p>
        <p>{subText}</p>
        <p>Click to continue</p>
    </div>
}
