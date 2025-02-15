import { Form } from "react-router";
import { OutlineButton, DangerButton } from "~/components/shared/button";
import { StaticModal, useModal } from "~/components/shared/modal";

interface DeleteConfirmationProps {
  issues: Issue[];
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteConfirmation(props: DeleteConfirmationProps) {
  const { close, ...modalProps } = useModal();

  if (props.issues.length === 0) return;

  return (
    <StaticModal {...modalProps}>
      <div className="px-8 py-6 flex flex-col justify-between h-full">
        <p className="text-base">
          {props.issues.length > 1 ? (
            <>
              Are you sure you would like to delete{" "}
              <span className="font-semibold text-red-400">
                {props.issues.length}
              </span>{" "}
              issues?
            </>
          ) : (
            <>
              Are you sure you would like to delete the issue{" "}
              <span className="font-semibold text-red-400">
                {props.issues[0].title}
              </span>{" "}
              ?
            </>
          )}
        </p>
        <p className="text-sm text-zinc-300">
          Deleted issues available for 30 days
        </p>
        <Form
          className="flex justify-end space-x-4"
          onSubmit={(event) => {
            event.preventDefault();
            close();
            props.onConfirm();
          }}
        >
          <OutlineButton
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              close();
              props.onCancel();
            }}
          >
            Cancel
          </OutlineButton>
          <DangerButton>Confirm</DangerButton>
        </Form>
      </div>
    </StaticModal>
  );
}
