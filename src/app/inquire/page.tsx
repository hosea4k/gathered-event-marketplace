import InquiryForm from "@/components/InquiryForm";

export default function InquirePage() {
  return (
    <div className="mx-auto max-w-lg px-5 py-14">
      <h1 className="text-2xl font-semibold tracking-tight">Get in touch</h1>
      <p className="mt-2 text-[var(--muted)]">
        Have a question that&apos;s not covered by a space listing, or want help choosing? Send a
        message and the team will follow up — or use the chat assistant in the corner for instant
        answers.
      </p>
      <div className="mt-6">
        <InquiryForm />
      </div>
    </div>
  );
}
